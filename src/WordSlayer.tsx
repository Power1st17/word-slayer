import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import words from "@/assets/words.json"; // โหลดไฟล์ JSON (ต้องใช้ Vite/Webpack)

const wordSet = new Set<string>(
  words.filter((word: string) => word.length > 1 && word.length <= 7)
);

const LETTER_POWER: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8,
  k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1,
  u: 1, v: 4, w: 4, x: 8, y: 4, z: 10
};

const WordSlayer: React.FC = () => {
  const [playerHp, setPlayerHp] = useState<number>(50);
  const [botHp, setBotHp] = useState<number>(50);
  const [playerLetters, setPlayerLetters] = useState<string[]>(generateLetters());
  const [botLetters, setBotLetters] = useState<string[]>(generateLetters());
  const [inputWord, setInputWord] = useState<string>("");
  const [botInputWord, setBotInputWord]=useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [battleInProgress, setBattleInProgress] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [damageDealt, setDamageDealt] = useState<number>(0);
  const [damageToLoser, setDamageToLoser] = useState<number>(0);
  const [roundSummaryReady, setRoundSummaryReady] = useState<boolean>(false);

  function isValidWord(word: string): boolean {
    return wordSet.has(word.toLowerCase()); // ตรวจสอบคำในพจนานุกรม (O(1))
  }

  function getValidWords(letters: string[]): string[] {
    const results = new Set<string>();
  
    function backtrack(prefix: string, remaining: string[]) {
      if (prefix.length > 1 && wordSet.has(prefix)) {
        results.add(prefix);
      }
      for (let i = 0; i < remaining.length; i++) {
        backtrack(prefix + remaining[i], [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
      }
    }
  
    backtrack("", letters);
    return Array.from(results);
  }

  function generateLetters(): string[] {
    return Array.from({ length: 7 }, () => randomLetter());
  }

  function randomLetter(): string {
    const keys = Object.keys(LETTER_POWER);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function calculatePower(word: string): number {
    return [...word].reduce((sum, letter) => sum + (LETTER_POWER[letter] || 0), 0);
  }

  function handleLetterClick(letter: string, idx: number): void {
    if (inputWord.includes(letter)) {
      setInputWord((prev) => {
        const newWord = prev.replace(letter, "");
        setCurrentScore(calculatePower(newWord));
        return newWord;
      });
    } else {
      setInputWord((prev) => {
        const newWord = prev + letter;
        setCurrentScore(calculatePower(newWord));
        return newWord;
      });
    }
  }
  function replaceUsedLetters(): void {
    setPlayerLetters((letters) => letters.map((letter) => (inputWord.includes(letter) ? randomLetter() : letter)));
    setBotLetters((letters) => letters.map((letter) => (botInputWord.includes(letter) ? randomLetter() : letter)));
  }

 function handleSubmit():void{
    if (!inputWord) return;
  
    // ตรวจสอบคำศัพท์ก่อน
    const isWordValid = isValidWord(inputWord);
    if (!isWordValid) {
      setLog((prev) => [`❌ '${inputWord.toUpperCase()}' is not a valid word!`, ...prev]);
      setInputWord("");
      setCurrentScore(0);
      return;
    }
  
    const playerDamage = calculatePower(inputWord);
    setLog((prev) => [`🧑‍🚀 Player used '${inputWord.toUpperCase()}' (-${playerDamage} HP)`, ...prev]);
    setInputWord("");
    setCurrentScore(0);
  
    // Trigger battle animation
    setBattleInProgress(true);
    setWinner(null);
    setDamageDealt(0);
    setRoundSummaryReady(false);
  
    setTimeout(() => {
      botTurn(playerDamage);
    }, 1000);
  }

  function botTurn(playerDamage: number): void {
    if (botHp <= 0) return;

    // Simulate bot's word and calculate damage
    const botValidWord = getValidWords(botLetters)
    const botInput = botValidWord[Math.floor(Math.random() * botValidWord.length)]
    const botDamage = calculatePower(botInput);
    setLog((prev) => [`🤖 Bot used '${botInput.toUpperCase()}' (-${botDamage} HP)`, ...prev]);
    setBotInputWord(botInput)

    // Calculate the difference in points
    const damageDifference = Math.abs(playerDamage - botDamage);

    // Determine winner and loser based on points
    const winnerIsPlayer = playerDamage > botDamage;
    const loserDamage = damageDifference;

    setWinner(winnerIsPlayer ? "Player" : "Bot");
    setDamageDealt(loserDamage);

    replaceUsedLetters();
    setBotInputWord("");
    // Apply damage to the loser (the one who has less score)
    if (winnerIsPlayer) {
      setBotHp((hp) => Math.max(0, hp - loserDamage));
    } else {
      setPlayerHp((hp) => Math.max(0, hp - loserDamage));
    }

    // Set the round summary as ready to display
    setRoundSummaryReady(true);

    // Trigger battle animation after both submit words
    setTimeout(() => {
      setBattleInProgress(false);
    }, 1000); // Delay for animation
}

  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Word Slayer Game</h1>
      <Card>
        <CardContent className="p-4">
          <p>HP Player: {playerHp}</p>
          <p>HP Bot: {botHp}</p>
        </CardContent>
      </Card>
      <div className="flex gap-2 justify-center">
        {playerLetters.map((letter, idx) => (
          <div key={idx} className="relative">
            <Button
              onClick={() => handleLetterClick(letter, idx)}
              className="relative w-12 h-12 flex items-center justify-center"
            >
              {letter.toUpperCase()}
              <span className="absolute bottom-0 right-0 text-xs bg-gray-700 text-white px-1 rounded">
                {LETTER_POWER[letter]}
              </span>
            </Button>
          </div>
        ))}
      </div>
      <p className="text-lg font-bold">Current Score: {currentScore}</p>
      <input
        className="border p-2 w-full text-center"
        value={inputWord}
        onChange={(e) => setInputWord(e.target.value)}
        disabled // Disable input during battle
      />
      <Button onClick={handleSubmit} className="w-full bg-blue-500">Submit</Button>

      {/* Battle Animation */}
      {battleInProgress && (
        <div className="flex justify-center mt-4">
          <motion.div
            className="flex gap-4 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold"
              animate={{ x: [0, 20, -20, 0], scale: [1, 1.2, 1], rotate: [0, 30, -30, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              ⚔️
            </motion.div>
            <motion.div
              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold"
              animate={{ x: [0, -20, 20, 0], scale: [1, 1.2, 1], rotate: [0, -30, 30, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              🤖
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Winner Animation */}
      {roundSummaryReady && winner && (
        <motion.div
          className="mt-4 text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className={winner === "Player" ? "text-blue-500" : "text-red-500"}>
            {winner} Wins!
          </span>
          <div className="text-lg mt-2">
            <span className={winner === "Player" ? "text-red-500" : "text-blue-500"}>
              {winner === "Player" ? `Bot was damaged by ${damageDealt} HP` : `Player was damaged by ${damageDealt} HP`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Battle Log */}
      <div className="text-left mt-4 space-y-2">
        {log.map((entry, idx) => (
          <motion.p key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {entry}
          </motion.p>
        ))}
      </div>
    </div>
  );
};

export default WordSlayer;
