"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from 'react'
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

type Card = {code: string, image: string, value:string}

export default function Home() {
  // when remaining cards in single deck are below threshold, we need to shuffle
  const SHUFFLE_THRESHOLD = 26

  // a tally of the remaining cards in the deck
  const remainingCards = useRef<number>(0)

  // the deck id used for the card API
  const deckId = useRef<string>('')

  // a flag to signal whether the game is over or not
  const [gameOver, setGameOver] = useState(true)

  // the total value of cards for each player
  const [houseValue, setHouseValue] = useState<number>(0)
  const [playerValue, setPlayerValue] = useState<number>(0)

  // an array to store the list of cards each player holds
  const [houseCards, setHouseCards] = useState<Card[]>([])
  const [playerCards, setPlayerCards] = useState<Card[]>([])

  // calculate the value of a blackjack hand
  const calculateHandValue = (hand:{value:string}[]): number => {
    let handValue = 0
    let aceCount = 0

    // for each card
    for (let card of hand) {
      // if a face card, add 10
      if (card.value == 'KING' || card.value == 'QUEEN' || card.value == 'JACK') {
        handValue += 10
      }
      // if an ace, add 11
      else if (card.value == 'ACE') {
        handValue += 11

        // increment ace count
        aceCount++
      }
      // all other cards, convert the numerical string and add to the total
      else {
        handValue += parseInt(card.value)
      }
    }

    // while the hand is greater than 21, and there is at least one ace
    while(handValue > 21 && aceCount > 0) {
      // decrement the value by 10 since we started with 11
      handValue -= 10

      // decrement the number of aces
      aceCount--
    }

    return handValue
  }

  // on an error, clear the board and reset
  const handleError = () => {
    setHouseCards([])
    setPlayerCards([])
    setPlayerValue(0)
    setHouseValue(0)
    setGameOver(true)
  }

  // initialize a round of blackjack
  const initRound = async () => {
    console.log("Remaining",remainingCards.current)
    // if remaining cards less than threshold, shuffle
    if (remainingCards.current < SHUFFLE_THRESHOLD) {
      toast.success("Shuffling deck...")
      await shuffledDeck()
    }

    // set game over flag to false
    setGameOver(false)

    toast.success("New game. Good luck...")

    // draw 2 cards for house
    const houseCards = await drawCards(2)
    
    // if there was an error, show toast and return
    if (houseCards.length == 0) {
      toast.error("Fatal Error: drawing cards")
      handleError()
      return
    }

    // set hand for house
    setHouseCards(houseCards)
    setHouseValue(calculateHandValue(houseCards))

    // draw 2 cards for player
    const playerCards = await drawCards(2)

    // if there was an error, show toast and return
    if (playerCards.length == 0) {
      toast.error("Fatal Error: drawing cards")
      handleError()
      return
    }

    // set hand for player
    setPlayerCards(playerCards)
    setPlayerValue(calculateHandValue(playerCards))
  }

  const shuffledDeck = async () => {
    // shuffle the deck 
    const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    const responseJson = await response.json()

    // if there was an error, show toast and return
    if (!responseJson.success) {
      toast.error("Fatal Error: shuffling cards")
      handleError()
      return
    }

    // set variables appropriately
    remainingCards.current = responseJson.remaining
    deckId.current = responseJson.deck_id
  }

  // utility function to draw jsx for a hand of cards
  const displayHand = (hand:Card[]) => {
    return hand.map(card => {
      return <Image height="157" width="113" key={card.code} alt={card.code} src={card.image} />
    })
  }

  const drawCards = async (count:number): Promise<Card[]> => {
    try {
      // query for cards from the deck
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId.current}/draw/?count=${count}`)
      const responseJson = await response.json()

      // if error return empty array
      if (!responseJson.success) {
        return []
      }

      // update remaining cards
      remainingCards.current = responseJson.remaining

      // return cards
      return responseJson.cards
    }
    catch(e) {
      return []
    }
  }

  // hit for the user
  const hit = async () => {

    // darw another card
    const cards = await drawCards(1)

    // if an error
    if (cards.length == 0) {
      handleError()
      return
    }

    // set hand for player
    const newHand = playerCards.concat(cards)
    setPlayerCards(newHand)
    setPlayerValue(calculateHandValue(newHand))
  }

  // stand for the user
  const stand = () => {
    // the stand button does not appear if the player busted, so we can assume the user 
    // right now has a value of 21 or less
    
    // if the player has a score higher than the house, the user won
    if (playerValue > houseValue) {
      toast.success('Congratulations, you win!')
    }
    // if the player has a score equal to or less than the house, it is considered a loss
    else if (playerValue <= houseValue) {
      toast.error('Sorry, you lost.')
    }

    setGameOver(true)
  }

  // triggered when the player's value changes
  useEffect(() => {
    // if the player busted
    if (playerValue > 21) {
      // set the game over flag
      setGameOver(true)

      // show player lost
      toast.error('Bust. Sorry, you lost.')
    }
  }, [playerValue])

  return (
    <main className="text-white min-h-screen justify-center items-center flex flex-col bg-[#4E6A54] ">
      <div className="text-3xl font-bold">Blackjack</div>
      {houseCards.length > 0 &&
      <div className="mt-4">
        <div className="text-yellow-200">House: {houseValue}</div>
        <div className="flex justify-center">{displayHand(houseCards)}</div>
        <div className="text-yellow-200 mt-8">Player: {playerValue}</div>
        <div className="flex justify-center">{displayHand(playerCards)}</div>
        <div className="mt-4 flex flex-row gap-4 justify-center items-center">
          {!gameOver && 
          <>
          <button className="w-40 bg-black p-4 rounded-md text-yellow-200" type="button" onClick={hit}>Hit</button>
          <button className="w-40 bg-black p-4 rounded-md text-yellow-200" type="button" onClick={stand}>Stand</button>
          </>
          }
        </div>
      </div>
      }
      {gameOver &&
      <div><button className="mt-4 bg-black p-4 rounded-md text-yellow-200" type="button" onClick={initRound}>New Game</button></div>
      }
      <div><Toaster/></div>
    </main>
  );
}