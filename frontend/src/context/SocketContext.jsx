import { createContext, useContext } from 'react'

/** Provides socket emit actions (createRoom, joinRoom, startGame, playCard, …) */
export const SocketContext = createContext({})
export const useSocketContext = () => useContext(SocketContext)
