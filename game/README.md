# Spirit Chaos

We wanted to make a cozy-but-chaotic adventure game where the "enemies" are just extremely annoying roommates. The idea of food spirits haunting a house and being completely unhelpful about it felt like the right mix of funny and frustrating. The pixel-art RPG aesthetic was inspired by classic JRPG dialogue systems.

## 🎮 What it does

Spirit Chaos is a browser-based 2D adventure game built with Phaser 3. You play as Lia, who comes home to find three spirits — Poppy, Citrus, and Melody — have taken over her house. To restore order, you must explore different rooms, interact with increasingly unhinged objects and characters, and collect three lost music notes. 

Each spirit guards a note in their own unique way: 
* **Poppy (The Detective)** hides clues around the bedroom. You must investigate the traumatized doll, the snitching lamp, and survive a mirror jump-scare to get her note.
* **Citrus (The Chef)** has moved into the kitchen and forces you to play **The Taste Test Challenge**. You are blindfolded (screen goes dark) and must guess the fruit by the sounds they make (grape squishes, strawberry plops, lemon cries).
* **Melody (The Musician)** challenges you to a musical memory puzzle in the music room. 

Collect all three notes to trigger the true ending, but be careful! There are multiple endings depending on your actions.

## 🛠️ How we built it

- **Phaser 3** for the core game engine (scene management, collision, sprites, animations, audio).
- **Vite** as the build tool and development server, utilizing the `publicDir` feature to effortlessly serve static game assets.
- **Vanilla JavaScript** (ES modules) for all game logic, ensuring a lightweight and performant architecture.
- **Custom Dialogue System** built completely from scratch featuring a typewriter effect, per-character portrait switching, and dynamic speaker highlighting.
- **Centralized GameState Singleton** to easily persist inventory (notes collected), visited flags, and play time across independent scene transitions without coupling the scenes together.
- All art assets are original pixel sprites and beautifully themed room backgrounds.

## 🚧 Challenges we ran into

- **Seamless Scene Transitions:** Getting scene transitions to feel smooth without replaying intro sequences on every return visit. We solved this with a centralized `GameState.introDone` and `GameState.visited` flags.
- **Animation Management:** Phaser's animation system requires animations to be registered once globally; managing this across multiple scenes that each call `create()` independently required careful `anims.exists()` guards.
- **Audio State Handling:** Managing multiple audio tracks and ensuring proper loading, especially when files are missing or corrupted, requiring us to wrap audio playback in safe `this.cache.audio.exists()` checks to prevent hard crashes.
- **Minigame Logic Flow:** Balancing the Taste Test Challenge and the music puzzle (sequence memory game) needed careful state management to handle wrong answers, timers, and retries without breaking the dialogue flow.

## 🏆 Accomplishments that we're proud of

- **Original Dialogue System:** A fully original dialogue system built without any third-party dialogue library!
- **Living Environment:** Every interactable object in the game has its own personality and multi-line conversation (the emotionally stale bread, the revolutionary strawberries, the toaster in the bathtub).
- **Creative Minigames:** The Taste Test Challenge blindfold effect that dynamically changes screen tint while relying entirely on audio cues.
- **Multiple Endings:** We successfully implemented different endings based on player choices!
    * *Ending 2: "Lia Takes A Nap"* - Triggered if you decide to sleep on the floating bed.
    * *Ending 4: "The Special Ingredient"* - Triggered if you fail Citrus's Taste Test 3 times.
    * *The True Ending* - A grand finale sequence with all three spirits floating in a circle, notes merging into a bright light, and Poppy immediately ruining the peaceful moment.

## 📚 What we learned

- **Lifecycle Mastery:** Deep understanding of Phaser 3's scene lifecycle management and how to share state cleanly between scenes.
- **Narrative Design:** How much personality you can pack into a game through dialogue alone — the "talking objects" mechanic turned out to be the most memorable part of the experience.
- **Vite Integration:** How to leverage Vite's `publicDir` option for serving game assets cleanly in both development and production builds.
- **Life Lessons:** That *"the vibes are well-fed"* is a complete sentence and a valid life philosophy.

## 🚀 What's next for Spirit Chaos

- A proper visual inventory system so collected notes are visible on-screen at all times.
- Mobile touch controls and virtual joysticks for accessibility on phones.
- More rooms and more spirits to interact with.
- Saving progress to `localStorage` so the game remembers your notes and endings unlocked between sessions.
