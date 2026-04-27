import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useGameStore from '../store/gameStore'
import { useSoundEngine } from './useSoundEngine'

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

    socket.on('lobby_update', ({ players }) => {
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

  return { createRoom, joinRoom, startGame, playCard, nextRound, requestState }
}
