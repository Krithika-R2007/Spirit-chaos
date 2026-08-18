import { Scene, manager } from '@tialops/maki'
import NewScene from './NewScene.js'

export default class GameScene extends Scene {
    preload() {
        super.preload()
        this.lia = this.maki.player('lia')
        manager.map(this, 'default_map')
        manager.preload(this)
    }

    create() {
        super.create()
        manager.create(this)

        if (!this.scene.get('NewScene')) {
            this.scene.add('NewScene', NewScene, false)
        }

        // Place lia in the center of the map (50×50 tiles × 16px = 800×800)
        this.lia.sprite.setPosition(400, 400)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'default_map'))

        this.input.keyboard.off('keydown-T')
        this.input.keyboard.on('keydown-T', () => {
            this.scene.stop('GameScene')
            this.scene.start('NewScene')
        })
    }

    update() {
        this.maki.move(this.lia)
    }
}
