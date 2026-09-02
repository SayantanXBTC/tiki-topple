import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import useGameStore from '../store/gameStore'
import { useSoundEngine } from './useSoundEngine'

// Human-readable move narration built from the server's card_played payload
function narrateAction(a, myPlayerId) {
  if (!a) return null
  const who = a.actorId === myPlayerId ? 'You' : (a.actorName || 'Opponent')
  const verb = a.actorId === myPlayerId ? '' : 's'
  const target = a.targetName || 'a tiki'
  switch (a.cardType) {
    case 'up1':    return `${who} raise${verb} ${target} by 1`
    case 'up2':    return `${who} raise${verb} ${target} by 2`
    case 'up3':    return `${who} raise${verb} ${target} by 3`
    case 'topple': return `${who} topple${verb} ${target} to the bottom`
    case 'toast':  return `${who} toast${verb} ${a.toastedName || 'a tiki'} 🔥`
    default:       return `${who} played ${a.cardType}`
  }
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function useSocket() {
  const socketRef = useRef(null)
  const store     = useGameStore()
  const sound     = useSoundEngine()

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports:           ['websocket'],
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
    })
    socketRef.current = socket

    // ── Connection lifecycle ─────────────────────────────────────────────────

    socket.on('connect', () => {
      useGameStore.setState({ connectionStatus: 'connected' })

      // If we were in a game and reconnected, request state
      const { myRoomCode, myPlayerId, screen } = useGameStore.getState()
      if (myRoomCode && myPlayerId && screen !== 'home') {
        socket.emit('request_state', { roomCode: myRoomCode, playerId: myPlayerId })
      }
    })

    socket.on('disconnect', () => {
      useGameStore.setState({ connectionStatus: 'disconnected' })
    })

    socket.on('connect_error', () => {
      useGameStore.setState({ connectionStatus: 'reconnecting' })
    })

    socket.io.on('reconnect_attempt', () => {
      useGameStore.setState({ connectionStatus: 'reconnecting' })
    })

    socket.io.on('reconnect', () => {
      useGameStore.setState({ connectionStatus: 'connected' })
    })

    socket.io.on('reconnect_failed', () => {
      useGameStore.setState({ connectionStatus: 'failed' })
    })

    // ── Room events ──────────────────────────────────────────────────────────

    socket.on('room_created', ({ roomCode, playerId, playerName, color, avatarId, isHost }) => {
      useGameStore.setState({
        myRoomCode:  roomCode,
        myPlayerId:  playerId,
        myName:      playerName,
        myColor:     color,
        myAvatarId:  avatarId,
        isHost,
        screen:      'lobby',
      })
    })

    socket.on('vs_computer_ready', ({ roomCode, playerId, playerName, color, avatarId, ...playerView }) => {
      useGameStore.setState({
        myRoomCode: roomCode,
        myPlayerId: playerId,
        myName:     playerName,
        myColor:    color,
        myAvatarId: avatarId,
        isHost:     true,
      })
      store.updateFromPlayerView(playerView)
      store.setScreen('game')
      sound.startAmbient()
    })

    socket.on('room_joined', ({ playerId, playerName, color, avatarId, isHost }) => {
      useGameStore.setState({
        myPlayerId:  playerId,
        myName:      playerName,
        myColor:     color,
        myAvatarId:  avatarId,
        isHost,
        screen:      'lobby',
      })
    })

    // Track previous lobby roster to detect joins/leaves for toast narration
    let prevLobbyIds = new Set()
    socket.on('lobby_update', ({ players }) => {
      const newIds = new Set(players.map(p => p.id))
      // Skip narration on very first update (initial roster)
      if (prevLobbyIds.size > 0) {
        for (const p of players) {
          if (!prevLobbyIds.has(p.id)) {
            toast(`${p.name} joined the lobby`, {
              duration: 2000,
              style: { borderLeft: `4px solid ${p.color || '#d4af37'}` },
            })
          }
        }
        for (const id of prevLobbyIds) {
          if (!newIds.has(id)) {
            toast('A player left the lobby', { duration: 1800 })
          }
        }
      }
      prevLobbyIds = newIds
      store.setLobbyPlayers(players)
    })

    socket.on('host_changed', ({ newHostId }) => {
      const myId = useGameStore.getState().myPlayerId
      useGameStore.setState({ isHost: myId === newHostId })
    })

    // ── Game flow events ─────────────────────────────────────────────────────

    socket.on('game_started', (playerView) => {
      store.updateFromPlayerView(playerView)
      store.setScreen('game')
      sound.startAmbient()
    })

    socket.on('state_update', (playerView) => {
      store.updateFromPlayerView(playerView)
      store.clearSelection()
      sound.play('tiki_move')
    })

    // Server narrates each move so clients can display a toast + save history.
    // Opponent moves stay on-screen longer (4.5s) so the player has time to
    // read what happened before the next bot move fires.
    socket.on('card_played', (action) => {
      const state = useGameStore.getState()
      const msg   = narrateAction(action, state.myPlayerId)
      if (!msg) return
      const isMine = action.actorId === state.myPlayerId
      toast(msg, {
        duration: isMine ? 2200 : 4500,
        style: {
          borderLeft: `5px solid ${action.actorColor || '#d4af37'}`,
          fontSize: isMine ? 13 : 15,
          fontWeight: isMine ? 400 : 700,
        },
      })
      // Push to store history if the store exposes it
      if (typeof state.pushMoveHistory === 'function') {
        state.pushMoveHistory({ ...action, text: msg, at: Date.now() })
      }
    })

    socket.on('round_ended', (data) => {
      store.setRoundEndData(data)
      store.setScreen('round_end')
      sound.play('round_end_reveal')
    })

    socket.on('round_started', (playerView) => {
      store.updateFromPlayerView(playerView)
      store.setScreen('game')
    })

    socket.on('game_over', (data) => {
      store.setGameOverData(data)
      store.setScreen('game_over')
      sound.stopAmbient()
      sound.play('game_over_fanfare')
    })

    // ── Error / notification events ──────────────────────────────────────────

    socket.on('game_error', ({ message }) => {
      store.setError(message)
      sound.play('error_buzz')
    })

    socket.on('join_error', ({ message }) => {
      store.setError(message)
    })

    socket.on('error', ({ message }) => {
      store.setError(message)
    })

    socket.on('player_disconnected', ({ playerName }) => {
      store.addNotification(`${playerName} disconnected — game paused`)
    })

    socket.on('game_resumed', ({ playerName }) => {
      store.addNotification(`${playerName} reconnected — game resumed`)
    })

    return () => socket.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Emit methods ─────────────────────────────────────────────────────────────

  const createRoom = (playerName, avatarId) =>
    socketRef.current?.emit('create_room', { playerName, avatarId })

  const joinRoom = (roomCode, playerName, avatarId) => {
    // Set myRoomCode optimistically — server's room_joined doesn't echo it back
    useGameStore.setState({ myRoomCode: roomCode.toUpperCase().trim() })
    socketRef.current?.emit('join_room', { roomCode, playerName, avatarId })
  }

  const startGame = () =>
    socketRef.current?.emit('start_game', { roomCode: useGameStore.getState().myRoomCode })

  const playCard = (cardType, targetTikiId) => {
    store.clearSelection()
    socketRef.current?.emit('play_card', {
      roomCode:     useGameStore.getState().myRoomCode,
      cardType,
      targetTikiId: targetTikiId ?? null,
    })
  }

  const nextRound = () =>
    socketRef.current?.emit('next_round', { roomCode: useGameStore.getState().myRoomCode })

  const requestState = () => {
    const { myRoomCode, myPlayerId } = useGameStore.getState()
    socketRef.current?.emit('request_state', { roomCode: myRoomCode, playerId: myPlayerId })
  }

  const startVsComputer = (playerCount, playerName, avatarId) =>
    socketRef.current?.emit('start_vs_computer', { playerCount, playerName, avatarId })

  return { createRoom, joinRoom, startGame, startVsComputer, playCard, nextRound, requestState }
}
