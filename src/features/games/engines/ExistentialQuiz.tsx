import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

/* ---------------- TYPES ---------------- */

type Trait =
  | "hustle" | "chill" | "delulu" | "reality" | "social" | "lone"
  | "discipline" | "chaos" | "brainrot" | "ego" | "broke" | "mainCharacter"
  | "unhinged" | "niche";

interface Option {
  text: string;
  traits: Trait[];
  nextId: string | null;
}

interface Q {
  id: string;
  q: string;
  a: [Option, Option, Option, Option]; // Every question has exactly 4 options = 256+ total
}

type Ending = {
  id: string;
  title: string;
  emoji: string;
  msg: string;
  rarity: "common" | "rare" | "mythic" | "secret";
  match: Partial<Record<Trait, number>>;
};

/* ---------------- DATA: THE MEGATREE (64+ Questions) ---------------- */

const DATA: Record<string, Q> = {
  // --- STARTING GATES (3 Total) ---
  start_1: { id: "start_1", q: "Your alarm goes off at BHU. It's Monday morning.", a: [
    { text: "Optimized for caffeine and hustle.", traits: ["hustle", "discipline"], nextId: "corp_1" },
    { text: "Attempting a soul-exit under the blanket.", traits: ["reality", "broke"], nextId: "rot_1" },
    { text: "4th snooze, living on the edge.", traits: ["chill", "chaos"], nextId: "soc_1" },
    { text: "Already in a fake meeting in my head.", traits: ["delulu", "mainCharacter"], nextId: "ego_1" },
  ]},
  start_2: { id: "start_2", q: "Crush asks: 'VT chalein shaam ko?' (Let's go to VT?)", a: [
    { text: "‘Cold coffee meri taraf se!’", traits: ["social", "broke"], nextId: "rom_1" },
    { text: "‘Nahi, mere ghar chalo?’", traits: ["unhinged", "ego"], nextId: "rom_1" },
    { text: "‘Maine aaj nahaaya nahi hai.’", traits: ["lone", "reality"], nextId: "soc_1" },
    { text: "‘Poora Lanka ghumayenge tumko.’", traits: ["mainCharacter", "delulu"], nextId: "rom_1" },
  ]},
  start_3: { id: "start_3", q: "Your phone screen is shattered. How do you feel?", a: [
    { text: "It's a metaphor for my life.", traits: ["niche", "ego"], nextId: "ego_1" },
    { text: "I'll use it until it cuts my thumb.", traits: ["chill", "broke"], nextId: "soc_4" },
    { text: "Admin probably did this to test me.", traits: ["delulu", "chaos"], nextId: "rot_1" },
    { text: "Time to buy a new one (with debt).", traits: ["hustle", "discipline"], nextId: "corp_1" },
  ]},

  // --- CORPORATE PATH (9 Total) ---
  corp_1: { id: "corp_1", q: "Boss sends 'Got a sec?'. You:", a: [
    { text: "Draft a resignation letter.", traits: ["reality", "lone"], nextId: "corp_2" },
    { text: "Reply 'For you? Always!'", traits: ["hustle", "ego"], nextId: "corp_2" },
    { text: "Status: 'Away' for 3 hours.", traits: ["chaos", "chill"], nextId: "corp_3" },
    { text: "Assume you're getting a promotion.", traits: ["delulu", "mainCharacter"], nextId: "corp_2" },
  ]},
  corp_2: { id: "corp_2", q: "Someone uses the word 'Synergy'.", a: [
    { text: "Roll eyes into the back of my skull.", traits: ["reality", "unhinged"], nextId: "corp_3" },
    { text: "Write it down to feel powerful.", traits: ["ego", "hustle"], nextId: "corp_3" },
    { text: "Wonder if I left the stove on.", traits: ["chaos", "brainrot"], nextId: "corp_4" },
    { text: "Think about tacos.", traits: ["chill", "lone"], nextId: "corp_3" },
  ]},
  corp_3: { id: "corp_3", q: "The reward for late work is a 'Pizza Party'.", a: [
    { text: "Tastes like cardboard sadness.", traits: ["broke", "reality"], nextId: "corp_4" },
    { text: "I'll just watch others eat.", traits: ["discipline", "mainCharacter"], nextId: "corp_4" },
    { text: "Steal the entire box and leave.", traits: ["chaos", "unhinged"], nextId: "corp_5" },
    { text: "Wait for the gluten-free option.", traits: ["lone", "niche"], nextId: "corp_4" },
  ]},
  corp_4: { id: "corp_4", q: "A colleague earns more for less work. You:", a: [
    { text: "Start a slow-burn psychological war.", traits: ["unhinged", "ego"], nextId: "corp_5" },
    { text: "Cry in the handicapped stall.", traits: ["reality", "broke"], nextId: "corp_5" },
    { text: "Manifest wealth with rose quartz.", traits: ["delulu", "brainrot"], nextId: "corp_6" },
    { text: "Quiet quit immediately.", traits: ["chill", "lone"], nextId: "corp_5" },
  ]},
  corp_5: { id: "corp_5", q: "Company hike gear check!", a: [
    { text: "Full North Face kit (on credit).", traits: ["hustle", "ego"], nextId: "corp_6" },
    { text: "Jeans and existential doom.", traits: ["reality", "chaos"], nextId: "corp_6" },
    { text: "Go to the wrong mountain.", traits: ["lone", "chill"], nextId: "corp_9" },
    { text: "A vape and a dream.", traits: ["brainrot", "unhinged"], nextId: "corp_6" },
  ]},
  corp_6: { id: "corp_6", q: "Your rival got promoted.", a: [
    { text: "Typing 'Congrats!' while sobbing.", traits: ["reality", "broke"], nextId: "corp_7" },
    { text: "LinkedIn Bio: 'Stealth Founder'.", traits: ["delulu", "ego"], nextId: "corp_7" },
    { text: "Move to a cabin in the woods.", traits: ["lone", "chaos"], nextId: null },
    { text: "Endorse them for 'Gaslighting'.", traits: ["chaos", "social"], nextId: "corp_7" },
  ]},
  corp_7: { id: "corp_7", q: "Recruiter says 'We are a family'.", a: [
    { text: "Run. It's a cult.", traits: ["reality", "lone"], nextId: "corp_8" },
    { text: "Do I get an emotional support plant?", traits: ["chill", "brainrot"], nextId: "corp_8" },
    { text: "Accept; I have exactly $4.", traits: ["broke", "discipline"], nextId: "corp_8" },
    { text: "Negotiate for infinite equity.", traits: ["delulu", "hustle"], nextId: "corp_8" },
  ]},
  corp_8: { id: "corp_8", q: "What's your actual 5-year plan?", a: [
    { text: "CEO of a company that doesn't exist.", traits: ["delulu", "hustle"], nextId: "corp_9" },
    { text: "Winning the lottery.", traits: ["chill", "lone"], nextId: "corp_9" },
    { text: "Still trying to fix my 2FA.", traits: ["brainrot", "chaos"], nextId: "corp_9" },
    { text: "Comfortable middle management.", traits: ["reality", "discipline"], nextId: "corp_9" },
  ]},
  corp_9: { id: "corp_9", q: "Define 'Success'.", a: [
    { text: "Corner office, zero friends.", traits: ["hustle", "ego"], nextId: null },
    { text: "Being able to sleep at night.", traits: ["reality", "chill"], nextId: null },
    { text: "Firing people who doubted me.", traits: ["unhinged", "mainCharacter"], nextId: null },
    { text: "Owning 0.00001 Bitcoin.", traits: ["delulu", "broke"], nextId: null },
  ]},

  // --- BRAINROT PATH (9 Total) ---
  rot_1: { id: "rot_1", q: "A meme you don't understand is trending.", a: [
    { text: "Pretend to get it and laugh.", traits: ["social", "ego"], nextId: "rot_2" },
    { text: "Call it 'cringe' and leave.", traits: ["lone", "niche"], nextId: "rot_2" },
    { text: "Research for 4 hours.", traits: ["brainrot", "discipline"], nextId: "rot_2" },
    { text: "Post it with the caption 'Real'.", traits: ["chaos", "unhinged"], nextId: "rot_2" },
  ]},
  rot_2: { id: "rot_2", q: "Phone battery is at 1%.", a: [
    { text: "Accept mortality.", traits: ["reality", "chill"], nextId: "rot_3" },
    { text: "Screaming at a total stranger.", traits: ["unhinged", "social"], nextId: "rot_3" },
    { text: "Make it a vlog plot twist.", traits: ["mainCharacter", "delulu"], nextId: "rot_4" },
    { text: "Wait for the darkness.", traits: ["lone", "niche"], nextId: "rot_3" },
  ]},
  rot_3: { id: "rot_3", q: "The AI starts speaking to you.", a: [
    { text: "Ask it to write a breakup text.", traits: ["hustle", "lone"], nextId: "rot_4" },
    { text: "Try to gaslight the AI.", traits: ["chaos", "ego"], nextId: "rot_4" },
    { text: "Be polite so it spares me later.", traits: ["reality", "social"], nextId: "rot_4" },
    { text: "Send it a meme it won't get.", traits: ["brainrot", "chill"], nextId: "rot_5" },
  ]},
  rot_4: { id: "rot_4", q: "Internet is down for 24 hours.", a: [
    { text: "Actually talk to my neighbors.", traits: ["social", "chaos"], nextId: "rot_5" },
    { text: "Read a physical book from 2019.", traits: ["discipline", "lone"], nextId: "rot_5" },
    { text: "Stare at the wall and 'vibe'.", traits: ["brainrot", "reality"], nextId: "rot_5" },
    { text: "The Apocalypse has begun.", traits: ["delulu", "mainCharacter"], nextId: "rot_6" },
  ]},
  rot_5: { id: "rot_5", q: "Choose your primary fighter:", a: [
    { text: "Twitter (Mental illness).", traits: ["chaos", "ego"], nextId: "rot_6" },
    { text: "Instagram (The Trap).", traits: ["mainCharacter", "social"], nextId: "rot_6" },
    { text: "Reddit (Actually...).", traits: ["lone", "brainrot"], nextId: "rot_7" },
    { text: "Notes App (Cheaper therapy).", traits: ["reality", "discipline"], nextId: "rot_6" },
  ]},
  rot_6: { id: "rot_6", q: "If you were a meme, which one?", a: [
    { text: "'This is Fine' dog.", traits: ["reality", "chill"], nextId: "rot_7" },
    { text: "Distracted Boyfriend.", traits: ["chaos", "unhinged"], nextId: "rot_7" },
    { text: "Stonks guy.", traits: ["delulu", "hustle"], nextId: "rot_7" },
    { text: "Woman yelling at a cat.", traits: ["lone", "social"], nextId: "rot_8" },
  ]},
  rot_7: { id: "rot_7", q: "A TikTok 'Alpha' gives you advice.", a: [
    { text: "Try it and sleep for 20 hours.", traits: ["chaos", "hustle"], nextId: "rot_8" },
    { text: "Comment 'Ratio'.", traits: ["brainrot", "social"], nextId: "rot_8" },
    { text: "Feel a hollow inadequacy.", traits: ["reality", "lone"], nextId: "rot_8" },
    { text: "Block for my own safety.", traits: ["discipline", "chill"], nextId: "rot_8" },
  ]},
  rot_8: { id: "rot_8", q: "Screen time report: 11 hours.", a: [
    { text: "Rookie numbers.", traits: ["brainrot", "ego"], nextId: "rot_9" },
    { text: "It's all 'Market Research'.", traits: ["delulu", "hustle"], nextId: "rot_9" },
    { text: "Throw phone in a public lake.", traits: ["chaos", "lone"], nextId: null },
    { text: "Accept that I am a parasite.", traits: ["reality", "chill"], nextId: "rot_9" },
  ]},
  rot_9: { id: "rot_9", q: "The internet dies forever. Now what?", a: [
    { text: "I simply dissolve into dust.", traits: ["brainrot", "ego"], nextId: null },
    { text: "I become a farmer with anxiety.", traits: ["reality", "chaos"], nextId: null },
    { text: "Philosopher-king of the ruins.", traits: ["delulu", "lone"], nextId: null },
    { text: "I am the one who caused it.", traits: ["unhinged", "mainCharacter"], nextId: null },
  ]},

  // --- EGO PATH (9 Total) ---
  ego_1: { id: "ego_1", q: "You see yourself in a shop window.", a: [
    { text: "Stop for a 10-minute photoshoot.", traits: ["mainCharacter", "ego"], nextId: "ego_2" },
    { text: "Think: 'God, I'm a masterpiece'.", traits: ["discipline", "delulu"], nextId: "ego_2" },
    { text: "Avoid eye contact with myself.", traits: ["lone", "reality"], nextId: "ego_2" },
    { text: "Make a weird face at the glass.", traits: ["chaos", "unhinged"], nextId: "ego_3" },
  ]},
  ego_2: { id: "ego_2", q: "An old friend says 'You've changed'.", a: [
    { text: "‘I have evolved, Steve.’", traits: ["ego", "hustle"], nextId: "ego_3" },
    { text: "‘I'm just tired, Steve.’", traits: ["reality", "chill"], nextId: "ego_3" },
    { text: "‘Is that a compliment? Better be.’", traits: ["mainCharacter", "unhinged"], nextId: "ego_4" },
    { text: "‘Welcome to my Villain Era.’", traits: ["brainrot", "chaos"], nextId: "ego_3" },
  ]},
  ego_3: { id: "ego_3", q: "What is the correct reaction to your entry?", a: [
    { text: "Stunned silence and awe.", traits: ["ego", "mainCharacter"], nextId: "ego_4" },
    { text: "A polite, friendly wave.", traits: ["social", "chill"], nextId: "ego_4" },
    { text: "Please don't notice me at all.", traits: ["lone", "reality"], nextId: "ego_4" },
    { text: "Total and utter confusion.", traits: ["unhinged", "chaos"], nextId: "ego_5" },
  ]},
  ego_4: { id: "ego_4", q: "Your autobiography title?", a: [
    { text: "The Sun, The Moon, and Me.", traits: ["ego", "delulu"], nextId: "ego_5" },
    { text: "$2 and a Vape Pen.", traits: ["broke", "chaos"], nextId: "ego_5" },
    { text: "The Art of Doing Nothing.", traits: ["chill", "lone"], nextId: "ego_6" },
    { text: "Wait, I Can't Read.", traits: ["brainrot", "reality"], nextId: "ego_5" },
  ]},
  ego_5: { id: "ego_5", q: "Someone insults your outfit. You:", a: [
    { text: "It's 'High Fashion' irony.", traits: ["niche", "ego"], nextId: "ego_6" },
    { text: "Cry in my car for an hour.", traits: ["reality", "broke"], nextId: "ego_6" },
    { text: "Stare at them until it's unsafe.", traits: ["unhinged", "lone"], nextId: "ego_7" },
    { text: "Post a poll asking followers.", traits: ["social", "brainrot"], nextId: "ego_6" },
  ]},
  ego_6: { id: "ego_6", q: "A star is named after you. Reaction?", a: [
    { text: "It was about time.", traits: ["delulu", "ego"], nextId: "ego_7" },
    { text: "Can I sell it for rent money?", traits: ["broke", "reality"], nextId: "ego_7" },
    { text: "It's probably a dead planet.", traits: ["lone", "niche"], nextId: "ego_8" },
    { text: "I technically own space now.", traits: ["brainrot", "mainCharacter"], nextId: "ego_7" },
  ]},
  ego_7: { id: "ego_7", q: "Your first commandment as King?", a: [
    { text: "Worship my specific aesthetic.", traits: ["mainCharacter", "ego"], nextId: "ego_8" },
    { text: "Mandatory 8-hour daily naps.", traits: ["chill", "social"], nextId: "ego_8" },
    { text: "Only vibes, no taxes.", traits: ["chaos", "broke"], nextId: "ego_9" },
    { text: "Delete the entire planet.", traits: ["unhinged", "reality"], nextId: "ego_8" },
  ]},
  ego_8: { id: "ego_8", q: "Your rival is succeeding.", a: [
    { text: "They are an industry plant.", traits: ["delulu", "ego"], nextId: "ego_9" },
    { text: "Comparison is the thief of joy.", traits: ["discipline", "chill"], nextId: "ego_9" },
    { text: "Good for them (I am lying).", traits: ["social", "reality"], nextId: "ego_9" },
    { text: "I will wait for their downfall.", traits: ["unhinged", "lone"], nextId: "ego_9" },
  ]},
  ego_9: { id: "ego_9", q: "Who is the most important person?", a: [
    { text: "Me. Obviously.", traits: ["ego", "mainCharacter"], nextId: null },
    { text: "The person holding the exit sign.", traits: ["reality", "lone"], nextId: null },
    { text: "The AI watching this.", traits: ["brainrot", "unhinged"], nextId: null },
    { text: "Nobody. We are all dust.", traits: ["chill", "niche"], nextId: null },
  ]},

  // --- SOCIAL PATH (10 Total) ---
  soc_1: { id: "soc_1", q: "At a party, your phone is...", a: [
    { text: "My literal life support machine.", traits: ["lone", "brainrot"], nextId: "soc_2" },
    { text: "A tool to find new friends.", traits: ["social", "ego"], nextId: "soc_2" },
    { text: "I've already left (Ghosted).", traits: ["chaos", "chill"], nextId: "soc_3" }, // Fixed: had null, now points to soc_3
    { text: "Searching for the nearest exit.", traits: ["reality", "broke"], nextId: "soc_2" },
  ]},
  soc_2: { id: "soc_2", q: "'What do you do for fun?' You:", a: [
    { text: "List my four side hustles.", traits: ["hustle", "ego"], nextId: "soc_3" },
    { text: "Panic and say 'Staring'.", traits: ["lone", "unhinged"], nextId: "soc_3" },
    { text: "Discuss an obscure documentary.", traits: ["niche", "discipline"], nextId: "soc_3" },
    { text: "I'm a professional sleeper.", traits: ["chaos", "broke"], nextId: "soc_4" },
  ]},
  soc_3: { id: "soc_3", q: "A group is laughing. You assume:", a: [
    { text: "They are laughing with me.", traits: ["social", "ego"], nextId: "soc_4" },
    { text: "I have something on my face.", traits: ["reality", "lone"], nextId: "soc_4" },
    { text: "They all hate me secretly.", traits: ["delulu", "broke"], nextId: "soc_5" },
    { text: "I'll join in without knowing why.", traits: ["chill", "chaos"], nextId: "soc_4" },
  ]},
  soc_4: { id: "soc_4", q: "An unknown number calls you.", a: [
    { text: "Throw the phone in the trash.", traits: ["unhinged", "chaos"], nextId: "soc_5" },
    { text: "‘This is the police department.’", traits: ["ego", "mainCharacter"], nextId: "soc_5" },
    { text: "Google the number immediately.", traits: ["reality", "lone"], nextId: "soc_5" },
    { text: "Let it ring forever.", traits: ["brainrot", "chill"], nextId: "soc_6" },
  ]},
  soc_5: { id: "soc_5", q: "Someone asks for 'Brutal Honesty'.", a: [
    { text: "Destroy their self-confidence.", traits: ["unhinged", "ego"], nextId: "soc_6" },
    { text: "Give a very safe compliment.", traits: ["social", "chill"], nextId: "soc_6" },
    { text: "Somehow make it about me.", traits: ["mainCharacter", "hustle"], nextId: "soc_6" },
    { text: "‘I like the colors you used.’", traits: ["reality", "brainrot"], nextId: "soc_7" },
  ]},
  soc_6: { id: "soc_6", q: "Waving at someone who wasn't waving.", a: [
    { text: "Keep waving at the sun.", traits: ["chaos", "delulu"], nextId: "soc_7" },
    { text: "Simply move to a new city.", traits: ["lone", "unhinged"], nextId: "soc_7" },
    { text: "A glitch in the Matrix.", traits: ["brainrot", "reality"], nextId: "soc_8" },
    { text: "I was just stretching.", traits: ["ego", "social"], nextId: "soc_7" },
  ]},
  soc_7: { id: "soc_7", q: "Can I borrow $20?", a: [
    { text: "I currently have exactly $15.", traits: ["broke", "reality"], nextId: "soc_8" },
    { text: "I need your SSN as collateral.", traits: ["ego", "hustle"], nextId: "soc_8" },
    { text: "I will never speak to you again.", traits: ["lone", "discipline"], nextId: "soc_9" },
    { text: "Money is a social construct.", traits: ["chaos", "niche"], nextId: "soc_8" },
  ]},
  soc_8: { id: "soc_8", q: "An elevator fart happens. You:", a: [
    { text: "Give an accusing look to others.", traits: ["ego", "social"], nextId: "soc_9" },
    { text: "Accept it as my fate.", traits: ["chill", "reality"], nextId: "soc_9" },
    { text: "Start humming very loudly.", traits: ["unhinged", "chaos"], nextId: "soc_9" },
    { text: "Analyze the physics of it.", traits: ["niche", "lone"], nextId: "soc_9" },
  ]},
  soc_9: { id: "soc_9", q: "A pigeon looks at you. It is a sign.", a: [
    { text: "It's a metaphor for my life.", traits: ["delulu", "mainCharacter"], nextId: "soc_10" },
    { text: "It is a government drone.", traits: ["unhinged", "brainrot"], nextId: "soc_10" },
    { text: "It just pooped on my shoe.", traits: ["reality", "broke"], nextId: "soc_10" },
    { text: "Keep walking, don't engage.", traits: ["chill", "lone"], nextId: "soc_10" },
  ]},
  soc_10: { id: "soc_10", q: "Final Social Check: People are...", a: [
    { text: "Exhausting but necessary.", traits: ["reality", "social"], nextId: null },
    { text: "My personal fan club.", traits: ["ego", "mainCharacter"], nextId: null },
    { text: "NPCs in my simulation.", traits: ["brainrot", "delulu"], nextId: null },
    { text: "A source of free snacks.", traits: ["broke", "chaos"], nextId: null },
  ]},

  // --- ROMANCE PATH (10 Total) ---
  rom_1: { id: "rom_1", q: "Crush asks: 'If I were an animal, what...?'", a: [
    { text: "‘A Panda, because you sleep 24/7.’", traits: ["chill", "reality"], nextId: "rom_2" },
    { text: "‘A Snake, because you broke my heart.’", traits: ["unhinged", "chaos"], nextId: "rom_2" },
    { text: "‘A Golden Retriever soul.’", traits: ["social", "delulu"], nextId: "rom_3" },
    { text: "‘A Wild Cat. Don't ask why.’", traits: ["ego", "mainCharacter"], nextId: "rom_2" },
  ]},
  rom_2: { id: "rom_2", q: "Mahila Mitra: 'Define me in 4 words.'", a: [
    { text: "‘Error 404: Not Found.’", traits: ["brainrot", "lone"], nextId: "rom_3" },
    { text: "‘Beautiful, Chaos, My, Headache.’", traits: ["social", "chaos"], nextId: "rom_4" },
    { text: "‘Tu toh meri bhai hai.’", traits: ["reality", "chill"], nextId: "rom_3" },
    { text: "‘Next, Slide, Please, Baby.’", traits: ["ego", "unhinged"], nextId: "rom_4" },
  ]},
  rom_3: { id: "rom_3", q: "Crush is typing... then stops.", a: [
    { text: "Throw the phone in the Ganga.", traits: ["unhinged", "chaos"], nextId: "rom_4" },
    { text: "Write a 5-paragraph apology.", traits: ["delulu", "broke"], nextId: "rom_4" },
    { text: "Assume she's just busy (Copium).", traits: ["reality", "chill"], nextId: "rom_5" },
    { text: "Block her to assert dominance.", traits: ["lone", "discipline"], nextId: "rom_4" },
  ]},
  rom_4: { id: "rom_4", q: "A random library girl asks for your number.", a: [
    { text: "Give her the Admin’s number.", traits: ["chaos", "hustle"], nextId: "hero_1" },
    { text: "Check for hidden cameras.", traits: ["reality", "lone"], nextId: "rom_5" },
    { text: "‘QR code scan karo payment ke liye.’", traits: ["broke", "brainrot"], nextId: "rom_5" },
    { text: "Give it and start wedding planning.", traits: ["delulu", "mainCharacter"], nextId: "rom_6" },
  ]},
  rom_5: { id: "rom_5", q: "Where is the first date?", a: [
    { text: "Lanka ke momos corner.", traits: ["broke", "social"], nextId: "rom_6" },
    { text: "A 5-star hotel (on credit card).", traits: ["ego", "hustle"], nextId: "rom_6" },
    { text: "Silent meditation at the Ghats.", traits: ["lone", "niche"], nextId: "rom_6" },
    { text: "My gaming room. PC setup is fire.", traits: ["brainrot", "unhinged"], nextId: "rom_6" },
  ]},
  rom_6: { id: "rom_6", q: "She mentions her 'Male Bestie'. Reaction?", a: [
    { text: "Initiate 'Male Bestie' protocol.", traits: ["chaos", "unhinged"], nextId: "rom_7" },
    { text: "Smile through the pain.", traits: ["reality", "broke"], nextId: "rom_7" },
    { text: "He is clearly a loser.", traits: ["ego", "delulu"], nextId: "rom_7" },
    { text: "Invite him to the group chat.", traits: ["social", "chill"], nextId: "rom_7" },
  ]},
  rom_7: { id: "rom_7", q: "She wants to see your 'Screen Time'.", a: [
    { text: "Jump off the nearest bridge.", traits: ["unhinged", "chaos"], nextId: null },
    { text: "‘Phone kharab ho gaya hai.’", traits: ["delulu", "brainrot"], nextId: "rom_8" },
    { text: "‘Exactly 30 mins total’ (I lied).", traits: ["ego", "discipline"], nextId: "rom_8" },
    { text: "Hand it over and accept the end.", traits: ["reality", "lone"], nextId: "rom_8" },
  ]},
  rom_8: { id: "rom_8", q: "She calls you 'Sweet'. You think:", a: [
    { text: "Friendzone warning level 10.", traits: ["reality", "lone"], nextId: "rom_9" },
    { text: "‘Tu bhi bahut sweet hai.’", traits: ["chill", "social"], nextId: "rom_9" },
    { text: "‘Main kadwa hoon.’", traits: ["niche", "unhinged"], nextId: "rom_9" },
    { text: "She wants to marry me.", traits: ["delulu", "mainCharacter"], nextId: "rom_9" },
  ]},
  rom_9: { id: "rom_9", q: "Valentine's Day plan?", a: [
    { text: "Studying for the Admin's test.", traits: ["hustle", "discipline"], nextId: "rom_10" },
    { text: "Flowers from a neighbor's garden.", traits: ["broke", "chaos"], nextId: "rom_10" },
    { text: "Manifesting a call from her.", traits: ["delulu", "brainrot"], nextId: "rom_10" },
    { text: "Netflix and cry alone.", traits: ["lone", "reality"], nextId: "rom_10" },
  ]},
  rom_10: { id: "rom_10", q: "Final Romance check: What is love?", a: [
    { text: "A chemical scam for losers.", traits: ["reality", "lone"], nextId: null },
    { text: "The reason I wake up.", traits: ["mainCharacter", "delulu"], nextId: null },
    { text: "A distraction from the grind.", traits: ["hustle", "ego"], nextId: null },
    { text: "Ask the Admin. He knows.", traits: ["brainrot", "chaos"], nextId: null },
  ]},

  // --- HERO / ADMIN PATH (10 Total) ---
  hero_1: { id: "hero_1", q: "The Professor gives a surprise quiz.", a: [
    { text: "Fake a seizure to save everyone.", traits: ["mainCharacter", "unhinged"], nextId: "hero_2" },
    { text: "‘Sir, system down hai.’", traits: ["brainrot", "chaos"], nextId: "hero_2" },
    { text: "Remind him about the homework.", traits: ["discipline", "lone"], nextId: "hero_2" },
    { text: "Wait for the Admin to hack it.", traits: ["delulu", "hustle"], nextId: "hero_3" },
  ]},
  hero_2: { id: "hero_2", q: "HOD caught you using this app.", a: [
    { text: "‘Sir, infrastructure testing.’", traits: ["hustle", "ego"], nextId: "hero_3" },
    { text: "‘Look! A flying samosa!’ (Run).", traits: ["chaos", "unhinged"], nextId: "hero_3" },
    { text: "The digital bhoot made me do it.", traits: ["brainrot", "delulu"], nextId: "hero_3" },
    { text: "Accept suspension with a smile.", traits: ["chill", "lone"], nextId: "hero_4" },
  ]},
  hero_3: { id: "hero_3", q: "You find a bug in this app. You:", a: [
    { text: "Report to Admin for a favor.", traits: ["hustle", "social"], nextId: "hero_4" },
    { text: "Exploit it for infinite rizz.", traits: ["chaos", "ego"], nextId: "hero_4" },
    { text: "Think it is an intentional feature.", traits: ["brainrot", "delulu"], nextId: "hero_4" },
    { text: "Delete the app and my life.", traits: ["unhinged", "lone"], nextId: "hero_4" },
  ]},
  hero_4: { id: "hero_4", q: "You become the 'Class Hero'.", a: [
    { text: "Treat everyone to Chacha’s kachori.", traits: ["social", "broke"], nextId: "hero_5" },
    { text: "Post a gym selfie with 'Hustle'.", traits: ["ego", "hustle"], nextId: "hero_5" },
    { text: "Delete all socials and go ghost.", traits: ["lone", "discipline"], nextId: "hero_6" },
    { text: "Start a cult in my hostel room.", traits: ["unhinged", "chaos"], nextId: "hero_5" },
  ]},
  hero_5: { id: "hero_5", q: "A fan asks for your autograph.", a: [
    { text: "Sign their forehead in permanent marker.", traits: ["mainCharacter", "unhinged"], nextId: "hero_6" },
    { text: "‘Main insaan hoon, bhagwan nahi.’", traits: ["delulu", "ego"], nextId: "hero_6" },
    { text: "Panic and run away crying.", traits: ["lone", "reality"], nextId: "hero_6" },
    { text: "Charge them 50 rupees.", traits: ["broke", "hustle"], nextId: "hero_6" },
  ]},
  hero_6: { id: "hero_6", q: "The Admin offers you a job. You:", a: [
    { text: "Accept (I am incredibly broke).", traits: ["broke", "hustle"], nextId: "hero_7" },
    { text: "Ask for 100% company equity.", traits: ["ego", "delulu"], nextId: "hero_7" },
    { text: "‘I work alone, like Batman.’", traits: ["lone", "niche"], nextId: "hero_7" },
    { text: "What is a job?", traits: ["brainrot", "chill"], nextId: "hero_7" },
  ]},
  hero_7: { id: "hero_7", q: "You see the Admin in the library.", a: [
    { text: "Bow down in total respect.", traits: ["social", "discipline"], nextId: "hero_8" },
    { text: "Ask for a refund of my time.", traits: ["chaos", "broke"], nextId: "hero_8" },
    { text: "Pretend he doesn't exist.", traits: ["ego", "reality"], nextId: "hero_8" },
    { text: "Try to steal his laptop.", traits: ["unhinged", "hustle"], nextId: "hero_8" },
  ]},
  hero_8: { id: "hero_8", q: "The app crashes on your phone.", a: [
    { text: "I have broken the simulation.", traits: ["mainCharacter", "unhinged"], nextId: "hero_9" },
    { text: "Restart the phone 50 times.", traits: ["brainrot", "discipline"], nextId: "hero_9" },
    { text: "‘Finally, inner peace.’", traits: ["chill", "lone"], nextId: "hero_9" },
    { text: "Cry to my Mahila Mitra.", traits: ["social", "reality"], nextId: "hero_9" },
  ]},
  hero_9: { id: "hero_9", q: "You are the face of BHU now.", a: [
    { text: "Model for the official brochure.", traits: ["ego", "mainCharacter"], nextId: "hero_10" },
    { text: "Use fame to get free chai.", traits: ["broke", "social"], nextId: "hero_10" },
    { text: "It's all a digital dream.", traits: ["delulu", "reality"], nextId: "hero_10" },
    { text: "I'm retiring at age 20.", traits: ["chill", "lone"], nextId: "hero_10" },
  ]},
  hero_10: { id: "hero_10", q: "Final Hero Test: Who created you?", a: [
    { text: "The Admin, the Myth, the Legend.", traits: ["hustle", "social"], nextId: null },
    { text: "I created my own destiny.", traits: ["ego", "mainCharacter"], nextId: null },
    { text: "A series of bad life decisions.", traits: ["chaos", "unhinged"], nextId: null },
    { text: "Error: Answer not found.", traits: ["brainrot", "lone"], nextId: null },
  ]},
};
/* ---------------- ENDINGS (15+ Total) ---------------- */

const ENDINGS: Ending[] = [
  // --- COMMON (The Usual Suspects) ---
  { id: "e1", title: "Corporate NPC", emoji: "💼", rarity: "common", match: { hustle: 5, discipline: 4, reality: 3 }, msg: "You have been successfully assimilated. Your severance package is a $10 Starbucks gift card." },
  { id: "e2", title: "Digital Parasite", emoji: "👾", rarity: "common", match: { brainrot: 7, chaos: 3 }, msg: "Your blood type is 5G. You haven't seen a vegetable since 2019." },
  { id: "e10", title: "The Peaceful Sloth", emoji: "🦥", rarity: "common", match: { chill: 8, lone: 2 }, msg: "You have achieved total inner peace. Also, you're fired." },
  { id: "e8", title: "The Broke Aristocrat", emoji: "🍷", rarity: "common", match: { broke: 7, ego: 4 }, msg: "You have champagne tastes and a tap water budget." },
  { id: "e11", title: "Social Wallflower", emoji: "🧱", rarity: "common", match: { social: 2, lone: 6, reality: 4 }, msg: "You spent the whole party calculating how soon you could leave without being rude." },

  // --- RARE (The 'Special' Ones) ---
  { id: "e3", title: "The Delusional CEO", emoji: "🚀", rarity: "rare", match: { delulu: 7, hustle: 5, ego: 4 }, msg: "You're disruptive! Mostly to your parents' retirement fund." },
  { id: "e4", title: "Main Character (Unrated)", emoji: "🎬", rarity: "rare", match: { mainCharacter: 8, ego: 5 }, msg: "You think life is a movie. Unfortunately, you're the extra who gets cut." },
  { id: "e6", title: "Chaotic Menace", emoji: "🧨", rarity: "rare", match: { unhinged: 6, chaos: 6 }, msg: "You're not 'quirky,' you're a liability to public safety." },
  { id: "e12", title: "The Grindset Martyr", emoji: "📉", rarity: "rare", match: { hustle: 8, discipline: 5, broke: 3 }, msg: "You work 100 hours a week to make a billionaire an extra $12. Heroic." },
  { id: "e13", title: "The Professional Gaslighter", emoji: "🌫️", rarity: "rare", match: { social: 6, ego: 6, delulu: 4 }, msg: "You've never been wrong in your life. Even when you were, it was actually someone else's fault." },

  // --- MYTHIC (The Specialists) ---
  { id: "e5", title: "The Void-Gazer", emoji: "🕳️", rarity: "mythic", match: { lone: 7, reality: 7, niche: 3 }, msg: "You see the truth. The truth is boring and everyone is annoyed by you." },
  { id: "e7", title: "The Niche Aesthetician", emoji: "🕯️", rarity: "mythic", match: { niche: 8, lone: 4, ego: 2 }, msg: "Your personality is 4 specific songs and a candle. Nobody understands you." },
  { id: "e14", title: "The Unhinged Oracle", emoji: "🔮", rarity: "mythic", match: { unhinged: 8, brainrot: 5, delulu: 5 }, msg: "Your tweets make no sense today, but they will be studied as prophecy in 2077." },

  // --- SECRET (The Breaking Point) ---
  { id: "e9", title: "SECRET: The Architect", emoji: "👁️", rarity: "secret", match: { reality: 10, chaos: 10, discipline: 5 }, msg: "You broke the simulation. Go outside. No, wait, that's part of it too." },
  { id: "e15", title: "SECRET: The Ghost in the Machine", emoji: "👻", rarity: "secret", match: { lone: 10, brainrot: 10, niche: 5 }, msg: "You've spent so much time online you've literally phased out of physical reality." },

  { id: "e16", title: "The Lanka Romeo", emoji: "🌹", rarity: "common", match: { social: 5, delulu: 4, broke: 3 }, msg: "You spend more time at VT than in class. Your GPA is 2.0 but your rizz is 10.0." },
  { id: "e17", title: "Admin's Favorite", emoji: "🛡️", rarity: "rare", match: { hustle: 6, discipline: 5, ego: 3 }, msg: "You know the app creator. You probably have the source code. You are basically untouchable." },
  { id: "e18", title: "The Backbench Philosopher", emoji: "🚬", rarity: "common", match: { lone: 6, chill: 5, niche: 3 }, msg: "You see through the system. You don't attend lectures, you attend 'revelations'." },
  { id: "e19", title: "Unhinged Simp", emoji: "🤡", rarity: "mythic", match: { unhinged: 8, delulu: 7, social: 4 }, msg: "You gave your crush your bank PIN. She hasn't replied in 3 years. Stay strong, king." },
  { id: "e20", title: "The Campus Legend", emoji: "🏆", rarity: "rare", match: { mainCharacter: 7, chaos: 6, ego: 5 }, msg: "Everyone knows your name. Nobody knows what department you're in. Iconic." },
  { id: "e21", title: "The Library Ghost", emoji: "👻", rarity: "mythic", match: { lone: 9, discipline: 6, reality: 5 }, msg: "You have a permanent seat in the library. People think you're part of the furniture." },
  { id: "e22", title: "The Samosa Specialist", emoji: "🥟", rarity: "common", match: { broke: 8, chill: 6, brainrot: 4 }, msg: "Your diet consists of canteen snacks and tap water. You are peak efficiency." },
  { id: "e23", title: "The Digital Deity", emoji: "⚡", rarity: "secret", match: { hustle: 10, ego: 10, mainCharacter: 10 }, msg: "You have transcended the user base. You ARE the app." },
  { id: "e24", title: "The VT Wanderer", emoji: "👣", rarity: "common", match: { chill: 8, lone: 4, social: 3 }, msg: "Just vibing near the temple, waiting for a sign. Or a cold coffee." },
  { id: "e25", title: "The Admin's Nightmare", emoji: "👺", rarity: "secret", match: { unhinged: 10, chaos: 10, broke: 5 }, msg: "You try to break every app you touch. The creator is watching you right now." },
];



/* ---------------- MAIN COMPONENT ---------------- */

export function ExistentialQuiz({ highScore, onDone }: any) {
  const haptic = useHaptics();
  const [started, setStarted] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [tally, setTally] = useState<Partial<Record<Trait, number>>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [over, setOver] = useState(false);

  const currentQ = useMemo(() => {
    // 1. Try to find the question the user is on
    // 2. If that's missing, try to find "start_corp"
    // 3. If that's also missing, just grab the very first thing in the list
    return DATA[currentId] || DATA["start_corp"] || Object.values(DATA)[0];

  }, [currentId]);
  const startRandomPath = () => {
    const entries = ["start_corp", "start_rot", "ego_1"];
    const chosen = entries[Math.floor(Math.random() * entries.length)];
    setCurrentId(chosen);
    setStarted(true);
    setTally({});
    setHistory([]);
    setOver(false);
  };

  const handleChoice = (opt: Option) => {
    haptic("tick");
    
    setTally(prev => {
      const next = { ...prev };
      opt.traits.forEach(t => {
        // Logic: Take existing value or 0, then add 1
        next[t] = (prev[t] || 0) + 1;
      });
      return next;
    });

    if (opt.nextId && DATA[opt.nextId]) {
      setHistory(prev => [...prev, currentId]);
      setCurrentId(opt.nextId);
    } else {
      setOver(true);
    }
  };

  const finalEnding = useMemo(() => {
    if (!over) return null;

    // 1. Convert user's tally to percentages (Normalized Profile)
    const totalUserPoints = Object.values(tally).reduce((a, b) => (a || 0) + (b || 0), 0) || 1;
    const userProfile: Record<string, number> = {};
    Object.entries(tally).forEach(([trait, value]) => {
      userProfile[trait] = (value || 0) / totalUserPoints;
    });

    let best = ENDINGS[0];
    let minDistance = Infinity;

    ENDINGS.forEach(e => {
      // 2. Convert ending target to percentages (Normalized Target)
      const targetTotal = Object.values(e.match).reduce((a, b) => a + b, 0) || 1;
      const targetProfile: Record<string, number> = {};
      Object.entries(e.match).forEach(([trait, value]) => {
        targetProfile[trait] = value / targetTotal;
      });

      // 3. Calculate Euclidean Distance
      let distance = 0;
      const allTraits = new Set([...Object.keys(userProfile), ...Object.keys(targetProfile)]);
      
      allTraits.forEach(trait => {
        const u = userProfile[trait] || 0;
        const t = targetProfile[trait] || 0;
        distance += Math.pow(u - t, 2);
      });

      const finalDist = Math.sqrt(distance);

      if (finalDist < minDistance) {
        minDistance = finalDist;
        best = e;
      }
    });

    return best;
  }, [over, tally]);

  if (!started) {
    return (
      <GameShell title="Identity Lab" subtitle="Searching for a personality..." onQuit={() => onDone(0)}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="text-8xl mb-8">🌀</motion.div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">You are currently: UNKNOWN</h1>
          <p className="text-white/40 font-mono text-xs mb-8 uppercase tracking-tighter">
            Unlock 15+ Destinies • Find the Secret Endings it has 2 • 256+ Psychotic Responses
          </p>
          <button onClick={startRandomPath} className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/20 active:scale-95 transition-transform">
            INITIATE PSYCH-EVAL
          </button>
        </div>
      </GameShell>
    );
  }

  if (!currentQ) return <div>Loading the chaos...</div>;

  return (
    <GameShell 
      title="Identity Crisis" 
      subtitle={`Depth: ${history.length + 1} | Profile: ${finalEnding?.rarity || "Analyzing..."}`}
      onQuit={() => onDone(0)}
    >
      <div className="p-6 h-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!over ? (
            <motion.div
              key={currentId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-4"
            >
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-4">
                <h3 className="text-xl font-bold text-white text-center">{currentQ.q}</h3>
              </div>
              <div className="grid gap-3">
                {currentQ.a.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleChoice(opt)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-left hover:bg-white/10 hover:text-white transition-all active:bg-primary/20"
                  >
                    <span className="text-xs opacity-30 mr-2 font-mono">0{i+1}</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <ResultCard
              title={finalEnding!.title}
              emoji={finalEnding!.emoji}
              message={finalEnding!.msg}
              score={Math.floor(Math.random() * 50) + 50}
              best={highScore}
              onPlayAgain={startRandomPath}
              onQuit={() => onDone(0)}
              accent={finalEnding!.rarity === 'secret' ? '#00FF00' : 'var(--primary)'}
            />
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}