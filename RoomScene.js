import { Scene, manager } from '@tialops/maki'

export default class NewScene extends Scene {
    constructor() {
        super('NewScene')
    }

    preload() {
        super.preload()
        this.lia = this.maki.player('lia')
        manager.map(this, 'new_tile')
        manager.preload(this)
    }

    create() {
        super.create()
        manager.create(this)

        this.lia.sprite.setPosition(160, 120)
        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'new_tile'))

        this.input.keyboard.off('keydown-Y')
        this.input.keyboard.on('keydown-Y', () => {
            this.scene.stop('NewScene')
            this.scene.start('GameScene')
        })
    }

    update() {
        this.maki.move(this.lia)
    }
}
