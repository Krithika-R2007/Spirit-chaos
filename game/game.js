import Phaser from 'phaser'
import TitleScene   from './scenes/TitleScene.js'
import BedroomScene from './scenes/BedroomScene.js'
import RoomScene    from './scenes/RoomScene.js'
import MusicScene   from './scenes/MusicScene.js'
import EndingScene  from './scenes/EndingScene.js'

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [TitleScene, BedroomScene, RoomScene, MusicScene, EndingScene]
})
