// 玩家飞机类
class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.targetX = this.x;
        this.targetY = this.y;
        this.speed = 5;
        this.health = 100;
        this.bullets = [];
        this.hasMagnet = false;
        this.hasShield = false;
        this.bulletLevel = 1;
        this.powerUpTimers = {};
        this.autoShootInterval = null;
        this.healthBar = document.getElementById('healthBar');
        this.startAutoShoot();
        this.tilt = 0;
        this.lastX = this.x;
        this.targetTilt = 0;
        this.isInvincible = false;     // 无敌状态
        this.invincibleTimer = null;   // 无敌计时器
        this.flashTimer = null;        // 闪烁计时器
        this.isVisible = true;         // 控制闪烁显示
        this.shieldWaves = []; // 新增：护盾光波数组
        this.shieldWaveSpeed = 2; // 新增：光波扩散速度
        this.maxWaveRadius = 100; // 新增：最大光波半径
        this.waveInterval = null; // 新增：光波生成计时器
        this.magnetParticles = []; // 新增：磁铁粒子效果
        this.weaponUpgradeParticles = []; // 新增：武器升级粒子效果
        this.healingParticles = []; // 新增：回血特效粒子
        this.weaponUpgradeRing = null; // 新增：武器升级环形特效
    }

    startAutoShoot() {
        this.autoShootInterval = setInterval(() => {
            if (!isPaused) {
                this.shoot();
            }
        }, 200); // 每200ms发射一次
    }

    updateHealth() {
        this.healthBar.style.width = `${this.health}%`;
    }

    draw() {
        // 计算倾斜角度，添加缓动效果
        const dx = this.x - this.lastX;
        this.targetTilt = dx * 0.05;
        this.targetTilt = Math.max(-0.3, Math.min(0.3, this.targetTilt));
        this.tilt += (this.targetTilt - this.tilt) * 0.1;
        
        this.lastX = this.x;

        // 绘制护盾光波效果
        if (this.hasShield) {
            // 更新和绘制所有光波
            this.shieldWaves = this.shieldWaves.filter(wave => {
                if (!isPaused) {
                    wave.radius += this.shieldWaveSpeed;
                }
                wave.alpha = Math.max(0, 0.8 * (1 - wave.radius / this.maxWaveRadius));
                
                // 绘制光波
                ctx.beginPath();
                ctx.strokeStyle = wave.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = wave.alpha;
                ctx.arc(this.x + this.width/2, this.y + this.height/2, wave.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 只保留还没有完全消失的光波
                return wave.alpha > 0;
            });
            
            ctx.globalAlpha = 1;
        }

        // 绘制护盾效果
        if (this.hasShield) {
            this.drawShieldEffect(60);
        }

        // 绘制磁铁效果
        if (this.hasMagnet) {
            // 绘制磁场范围
            ctx.beginPath();
            ctx.strokeStyle = '#ff8800';
            ctx.setLineDash([5, 5]);
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 150, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 绘制磁力线
            const time = isPaused ? 0 : Date.now() / 1000;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + time;
                const innerRadius = 60;
                const outerRadius = 150;
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 136, 0, ${0.5 + (isPaused ? 0.3 : Math.sin(time * 3 + i) * 0.3)})`;
                ctx.lineWidth = 2;
                
                for (let r = innerRadius; r <= outerRadius; r += 2) {
                    const x = this.x + this.width/2 + Math.cos(angle + (isPaused ? 0 : r/20)) * r;
                    const y = this.y + this.height/2 + Math.sin(angle + (isPaused ? 0 : r/20)) * r;
                    
                    if (r === innerRadius) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
        }

        // 只在可见状态下绘制飞机
        if (this.isVisible) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            
            const scale = Math.cos(this.tilt * 2);
            ctx.scale(scale, 1);
            
            ctx.rotate(this.tilt);
            
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.lineTo(this.width/2, this.height/2);
            ctx.lineTo(-this.width/2, this.height/2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }

    shoot() {
        switch(this.bulletLevel) {
            case 1:
                this.bullets.push(new Bullet(this.x + this.width/2, this.y));
                break;
            case 2:
                this.bullets.push(new Bullet(this.x + this.width/2 - 10, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 + 10, this.y));
                break;
            case 3:
                this.bullets.push(new Bullet(this.x + this.width/2, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 - 15, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 + 15, this.y));
                break;
            case 4:
                this.bullets.push(new Bullet(this.x + this.width/2, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 - 15, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 + 15, this.y));
                this.bullets.push(new Bullet(this.x + this.width/2 - 20, this.y, Math.PI/8.18));
                this.bullets.push(new Bullet(this.x + this.width/2 + 20, this.y, -Math.PI/8.18));
                break;
            case 5:
                this.bullets.push(new Bullet(this.x + this.width/2, this.y, 0, 'laser'));
                this.bullets.push(new Bullet(this.x + this.width/2 - 20, this.y, 0, 'wave'));
                this.bullets.push(new Bullet(this.x + this.width/2 + 20, this.y, 0, 'wave'));
                this.bullets.push(new Bullet(this.x + this.width/2 - 35, this.y, Math.PI/20));
                this.bullets.push(new Bullet(this.x + this.width/2 + 35, this.y, -Math.PI/20));
                this.bullets.push(new Bullet(this.x + this.width/2 - 20, this.y, Math.PI/8.18));
                this.bullets.push(new Bullet(this.x + this.width/2 + 20, this.y, -Math.PI/8.18));
                break;
        }
    }

    updateBullets() {
        if (!isPaused) {
            this.bullets = this.bullets.filter(bullet => {
                bullet.update();
                bullet.draw();
                return bullet.y > 0;
            });
        } else {
            // 暂停时只绘制子弹，不更新位置
            this.bullets.forEach(bullet => {
                bullet.draw();
            });
        }
    }

    activatePowerUp(type) {
        const magnetDuration = 10000;
        const shieldDuration = 5000;
        const maxBulletDuration = 7000;

        switch(type) {
            case POWERUP_TYPES.BULLET_UPGRADE:
                const oldLevel = this.bulletLevel;
                this.bulletLevel = Math.min(this.bulletLevel + 1, 5);
                this.activateWeaponUpgrade();
                
                if (this.bulletLevel === 5) {
                    if (this.powerUpTimers[type]) {
                        clearTimeout(this.powerUpTimers[type]);
                    }
                    this.powerUpTimers[type + '_startTime'] = Date.now();
                    this.powerUpTimers[type] = setTimeout(() => {
                        this.bulletLevel = 4;
                    }, maxBulletDuration);
                }
                break;
            case POWERUP_TYPES.SHIELD:
                this.activateShield();
                break;
            case POWERUP_TYPES.MAGNET:
                this.hasMagnet = true;
                break;
            case POWERUP_TYPES.HEALTH:
                this.health = Math.min(100, this.health + 30);
                this.updateHealth();
                this.activateHealEffect();
                break;
        }

        // 清除现有计时器
        if (this.powerUpTimers[type]) {
            clearTimeout(this.powerUpTimers[type]);
            clearInterval(this.powerUpTimers[type + '_interval']);
        }

        // 设置新计时器（除了子弹升级）
        if (type !== POWERUP_TYPES.BULLET_UPGRADE) {
            const duration = type === POWERUP_TYPES.MAGNET ? magnetDuration : shieldDuration;
            this.powerUpTimers[type + '_startTime'] = Date.now();
            this.powerUpTimers[type + '_duration'] = duration;

            const checkPowerUpStatus = () => {
                if (!isPaused) {
                    const elapsed = Date.now() - this.powerUpTimers[type + '_startTime'];
                    if (elapsed >= this.powerUpTimers[type + '_duration']) {
                        switch(type) {
                            case POWERUP_TYPES.SHIELD:
                                this.hasShield = false;
                                if (this.shieldEffect) {
                                    clearInterval(this.shieldEffect);
                                }
                                if (this.waveInterval) {
                                    clearInterval(this.waveInterval);
                                }
                                this.shieldWaves = [];
                                break;
                            case POWERUP_TYPES.MAGNET:
                                this.hasMagnet = false;
                                break;
                        }
                        cancelAnimationFrame(this.powerUpTimers[type + '_frame']);
                    } else {
                        this.powerUpTimers[type + '_frame'] = requestAnimationFrame(checkPowerUpStatus);
                    }
                } else {
                    this.powerUpTimers[type + '_frame'] = requestAnimationFrame(checkPowerUpStatus);
                }
            };
            
            checkPowerUpStatus();
        }
    }

    activateShield() {
        this.hasShield = true;
        this.shieldRadius = 0;
        
        this.shieldWaves = [];
        
        if (this.waveInterval) {
            clearInterval(this.waveInterval);
            this.waveInterval = null;
        }
        if (this.shieldEffect) {
            clearInterval(this.shieldEffect);
            this.shieldEffect = null;
        }
        
        this.shieldWaves.push({
            radius: 30,
            alpha: 0.8,
            color: `hsl(190, 100%, 70%)`
        });
        
        this.waveInterval = setInterval(() => {
            if (!isPaused) {
                this.shieldWaves.push({
                    radius: 30,
                    alpha: 0.8,
                    color: `hsl(190, 100%, 70%)`
                });
            }
        }, 700);

        this.shieldEffect = setInterval(() => {
            if (!isPaused) {
                this.shieldRadius = Math.min(this.shieldRadius + 2, 60);
                this.drawShieldEffect(this.shieldRadius);
            }
        }, 16);
    }

    drawShieldEffect(radius) {
        ctx.beginPath();
        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.arc(this.x + this.width/2, this.y + this.height/2, radius, 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, radius * 0.8,
            this.x + this.width/2, this.y + this.height/2, radius
        );
        gradient.addColorStop(0, 'rgba(102, 204, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(102, 204, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(102, 204, 255, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }

    activateInvincible() {
        this.isInvincible = true;
        
        if (this.invincibleTimer) {
            clearTimeout(this.invincibleTimer);
            clearInterval(this.flashTimer);
        }
        
        this.flashTimer = setInterval(() => {
            this.isVisible = !this.isVisible;
        }, 100);
        
        this.invincibleTimer = setTimeout(() => {
            this.isInvincible = false;
            this.isVisible = true;
            clearInterval(this.flashTimer);
        }, 3000);
    }

    activateWeaponUpgrade() {
        this.weaponUpgradeRing = {
            progress: 0,
            maxRadius: 80,
            startTime: Date.now()
        };
    }

    activateHealEffect() {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 1 + Math.random();
            this.healingParticles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 0.8,
                size: 4 + Math.random() * 3,
                color: '#ff3333'
            });
        }
    }

    updateParticles() {
        if (!isPaused) {
            this.healingParticles = this.healingParticles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 0.02;

                if (particle.alpha > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 51, 51, ${particle.alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    const gradient = ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.alpha})`);
                    gradient.addColorStop(1, `rgba(255, 51, 51, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    return true;
                }
                return false;
            });

            if (this.weaponUpgradeRing) {
                const elapsed = (Date.now() - this.weaponUpgradeRing.startTime) / 1000;
                this.weaponUpgradeRing.progress = Math.min(elapsed * 2, 1);

                if (this.weaponUpgradeRing.progress < 1) {
                    const radius = this.weaponUpgradeRing.maxRadius * this.weaponUpgradeRing.progress;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 150, 255, ${1 - this.weaponUpgradeRing.progress})`;
                    ctx.lineWidth = 3;
                    ctx.arc(this.x + this.width/2, this.y + this.height/2, radius, 0, Math.PI * 2);
                    ctx.stroke();

                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        const lineLength = 15 * (1 - this.weaponUpgradeRing.progress);
                        
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 150, 255, ${1 - this.weaponUpgradeRing.progress})`;
                        ctx.moveTo(
                            this.x + this.width/2 + Math.cos(angle) * radius,
                            this.y + this.height/2 + Math.sin(angle) * radius
                        );
                        ctx.lineTo(
                            this.x + this.width/2 + Math.cos(angle) * (radius + lineLength),
                            this.y + this.height/2 + Math.sin(angle) * (radius + lineLength)
                        );
                        ctx.stroke();
                    }
                } else {
                    this.weaponUpgradeRing = null;
                }
            }
        }
    }
}

// 子弹类
class Bullet {
    constructor(x, y, angle = 0, type = 'normal') {
        this.x = x;
        this.y = y;
        this.speed = type === 'laser' ? 10 : 7; // 激光速度增加到10
        this.angle = angle;
        this.type = type;
        
        if (type === 'laser') {
            this.width = 16;
            this.height = 50;
            this.damage = 50;
        } else if (type === 'wave') {
            this.width = 4;
            this.height = 20;
            this.damage = 25;
            this.waveOffset = 0;
        } else {
            this.width = 3;
            this.height = 15;
            this.damage = 20;
        }
    }

    update() {
        if (this.type === 'wave') {
            this.waveOffset += 0.1;
            this.x += Math.sin(this.waveOffset) * 2;
            this.y -= this.speed * Math.cos(this.angle);
        } else {
            this.x += this.speed * Math.sin(this.angle);
            this.y -= this.speed * Math.cos(this.angle);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        
        if (this.type === 'laser') {
            // 黄色激光效果
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-this.width/2, 0, this.width, this.height);
            
            // 增强光晕效果
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ffffaa';
            ctx.fillRect(-this.width * 1.5, 0, this.width * 3, this.height);
            
            // 添加渐变效果
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(1, '#ff8800');
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = gradient;
            ctx.fillRect(-this.width/2, 0, this.width, this.height);
        } else if (this.type === 'wave') {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-this.width/2, 0, this.width, this.height);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-this.width/2, 0, this.width, this.height);
        }
        
        ctx.restore();
    }
}

// 敌人类
class Enemy {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2;
        this.health = 40;
        this.isDying = false;
        this.deathAlpha = 1;
    }

    update() {
        if (!isPaused) {
            this.y += this.speed;
        }
    }

    draw() {
        if (this.isDying) {
            ctx.globalAlpha = this.deathAlpha;
            this.deathAlpha -= 0.1; // 控制消散速度
        }

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();

        if (this.isDying) {
            ctx.globalAlpha = 1;
        }
    }

    dropPowerUp() {
        const rand = Math.random();
        if (rand < 0.05) { // 5%概率掉落子弹升级
            powerUps.push(new PowerUp(
                this.x + this.width/2,
                this.y + this.height/2,
                POWERUP_TYPES.BULLET_UPGRADE
            ));
        } else if (rand < 0.10) { // 5%概率掉落护盾
            powerUps.push(new PowerUp(
                this.x + this.width/2,
                this.y + this.height/2,
                POWERUP_TYPES.SHIELD
            ));
        } else if (rand < 0.15) { // 5%概率掉落磁铁
            powerUps.push(new PowerUp(
                this.x + this.width/2,
                this.y + this.height/2,
                POWERUP_TYPES.MAGNET
            ));
        } else if (rand < 0.18) { // 3%概率掉落血量
            powerUps.push(new PowerUp(
                this.x + this.width/2,
                this.y + this.height/2,
                POWERUP_TYPES.HEALTH
            ));
        }
    }
}

// 分数道具类
class ScoreItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.speed = 2;
        this.value = 5;
    }

    update() {
        if (!isPaused) {
            this.y += this.speed;
            
            // 磁铁效果
            if (player.hasMagnet) {
                const dx = player.x + player.width/2 - this.x;
                const dy = player.y + player.height/2 - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    this.x += dx * 0.1;
                    this.y += dy * 0.1;
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 道具类
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.radius = 12; // 改用半径而不是宽高
        this.type = type;
        this.speed = 1;
    }

    update() {
        if (!isPaused) {
            this.y += this.speed;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // 为不同类型的道具设置不同的颜色和效果
        switch(this.type) {
            case POWERUP_TYPES.BULLET_UPGRADE:
                // 紫色渐变效果
                const bulletGradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                bulletGradient.addColorStop(0, '#ff66ff');
                bulletGradient.addColorStop(1, '#ff00ff');
                ctx.fillStyle = bulletGradient;
                break;
            case POWERUP_TYPES.SHIELD:
                // 青色渐变效果
                const shieldGradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                shieldGradient.addColorStop(0, '#66ffff');
                shieldGradient.addColorStop(1, '#00ffff');
                ctx.fillStyle = shieldGradient;
                break;
            case POWERUP_TYPES.MAGNET:
                // 橙色渐变效果
                const magnetGradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                magnetGradient.addColorStop(0, '#ffbb66');
                magnetGradient.addColorStop(1, '#ff8800');
                ctx.fillStyle = magnetGradient;
                break;
            case POWERUP_TYPES.HEALTH:
                // 红色渐变效果
                const healthGradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                healthGradient.addColorStop(0, '#ff6666');
                healthGradient.addColorStop(1, '#ff0000');
                ctx.fillStyle = healthGradient;
                break;
        }
        
        ctx.fill();
        
        // 为每种道具添加特殊标识
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        switch(this.type) {
            case POWERUP_TYPES.BULLET_UPGRADE:
                // 绘制"↑"符号
                ctx.moveTo(this.x, this.y - 6);
                ctx.lineTo(this.x, this.y + 6);
                ctx.moveTo(this.x - 4, this.y - 2);
                ctx.lineTo(this.x, this.y - 6);
                ctx.lineTo(this.x + 4, this.y - 2);
                break;
            case POWERUP_TYPES.SHIELD:
                // 绘制盾牌形状
                ctx.arc(this.x, this.y, this.radius * 0.5, Math.PI * 0.7, Math.PI * 2.3);
                break;
            case POWERUP_TYPES.MAGNET:
                // 绘制"M"形状
                ctx.moveTo(this.x - 5, this.y + 4);
                ctx.lineTo(this.x - 3, this.y - 4);
                ctx.lineTo(this.x, this.y + 2);
                ctx.lineTo(this.x + 3, this.y - 4);
                ctx.lineTo(this.x + 5, this.y + 4);
                break;
            case POWERUP_TYPES.HEALTH:
                // 绘制十字标志
                ctx.moveTo(this.x - 4, this.y);
                ctx.lineTo(this.x + 4, this.y);
                ctx.moveTo(this.x, this.y - 4);
                ctx.lineTo(this.x, this.y + 4);
                break;
        }
        ctx.stroke();
    }
}

// 云朵类
class Cloud {
    constructor() {
        this.width = Math.random() * 100 + 50; // 50-150的随机宽度
        this.height = this.width * 0.6;
        this.x = Math.random() * canvas.width;
        this.y = -this.height;
        this.speed = 0.5 + Math.random() * 0.5; // 0.5-1的随机速度
        this.opacity = 0.3 + Math.random() * 0.2; // 0.3-0.5的随机透明度
    }

    update() {
        if (!isPaused) {
            this.y += this.speed;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#ffffff';
        
        // 绘制一朵由多个圆形组成的云
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.5, this.width * 0.3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.5, this.width * 0.3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.3, this.width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 游戏主要变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const healthElement = document.getElementById('healthValue');

// 设置画布大小
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    
    // 根据屏幕大小调整游戏元素尺寸
    const scale = Math.min(windowWidth / 400, windowHeight / 600);
    
    if (player) {
        player.width = 50 * scale;
        player.height = 50 * scale;
        player.x = windowWidth / 2 - player.width / 2;
        player.y = windowHeight - player.height - 20;
    }
}

// 游戏状态常量
const POWERUP_TYPES = {
    BULLET_UPGRADE: 'bullet_upgrade',
    SHIELD: 'shield',
    MAGNET: 'magnet',
    HEALTH: 'health',
    CLEAR_SCREEN: 'clear_screen'
};

// 游戏状态变量
const CLEAR_SCREEN_COOLDOWN = 20000;
let lastClearScreenTime = Date.now();
let clearScreenReady = false;
let pauseStartTime = 0;
let gameLoop;
let backgroundY = 0;
let clouds = [];
let isPaused = false;
let isDayTime = true;
let lastBackgroundChange = Date.now();
const backgroundChangeInterval = 30000;
let backgroundTransitionProgress = 1;
const transitionDuration = 5000;
let isTransitioning = false;
let transitionStartTime = 0;
let explosionParticles = [];
let loadedImages = 0;
const totalImages = 2;
let enemies = [];
let scoreItems = [];
let powerUps = [];
let score = 0;
let isGameOver = false;
let player = null;

// 创建白天和黑夜的背景
const dayBackground = new Image();
const nightBackground = new Image();

// 图片加载完成检查
function checkAllImagesLoaded() {
    loadedImages++;
    if (loadedImages === totalImages) {
        // 创建玩家实例
        player = new Player();
        // 重置游戏状态
        resetGame();
        // 初始化清屏按钮
        initClearScreenButton();
    }
}

// 设置背景图片源并添加加载事件
dayBackground.onload = checkAllImagesLoaded;
nightBackground.onload = checkAllImagesLoaded;

dayBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDA2NmZmIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDk5ZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2NmNjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
nightBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDAwMDMzIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDAwNjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAwOTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';

// 在游戏主循环中添加暂停状态检查
function gameUpdate() {
    if (!player || isGameOver) {
        cancelAnimationFrame(gameLoop);
        return;
    }

    // 清空画布并绘制背景
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新和绘制游戏元素
    if (!isPaused) {
        // 检查是否需要开始背景切换
        const currentTime = Date.now();
        if (!isTransitioning && currentTime - lastBackgroundChange >= backgroundChangeInterval) {
            isTransitioning = true;
            transitionStartTime = currentTime;
            isDayTime = !isDayTime;
            lastBackgroundChange = currentTime;
        }

        // 更新过渡进度
        if (isTransitioning) {
            const timeSinceTransitionStart = currentTime - transitionStartTime;
            backgroundTransitionProgress = Math.min(timeSinceTransitionStart / transitionDuration, 1);
            
            if (backgroundTransitionProgress >= 1) {
                isTransitioning = false;
                backgroundTransitionProgress = 1;
            }
        }

        // 修改背景滚动速度为每帧0.2像素
        backgroundY = (backgroundY + 0.2) % canvas.height;

        // 更新游戏状态
        updatePlayer();
        spawnEnemy();
        
        // 更新所有游戏对象
        enemies.forEach(enemy => enemy.update());
        scoreItems.forEach(item => item.update());
        powerUps.forEach(powerUp => powerUp.update());
        
        // 检查碰撞
        checkCollisions();

        // 生成新的云朵
        if (Math.random() < 0.01) {
            clouds.push(new Cloud());
        }
        
        // 更新云朵
        clouds = clouds.filter(cloud => {
            cloud.update();
            return cloud.y < canvas.height;
        });
    }
    
    // 绘制背景
    drawBackground();

    // 绘制所有游戏对象（无论是否暂停都需要绘制）
    player.updateParticles();
    player.draw();
    player.updateBullets();
    
    enemies.forEach(enemy => enemy.draw());
    scoreItems.forEach(item => item.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    updateExplosionParticles();
    clouds.forEach(cloud => cloud.draw());
    
    // 绘制版本号和游戏标题
    drawGameInfo();

    // 如果游戏暂停，绘制暂停菜单
    if (isPaused) {
        drawPauseMenu();
    }

    // 检查游戏结束条件
    if (player.health <= 0) {
        isGameOver = true;
        setTimeout(() => {
            const restart = confirm(`游戏结束！得分：${score}\n是否重新开始？`);
            if (restart) {
                resetGame();
            }
        }, 100);
        return;
    }
    
    gameLoop = requestAnimationFrame(gameUpdate);
}

// 添加暂停/继续函数
function togglePause() {
    if (!player) return;
    
    if (!isPaused) {
        // 暂停游戏
        pauseStartTime = Date.now();
        isPaused = true;
        console.log('游戏已暂停');
    } else {
        // 继续游戏
        const pauseDuration = Date.now() - pauseStartTime;
        // 更新所有需要暂停的计时器
        lastClearScreenTime += pauseDuration;
        lastBackgroundChange += pauseDuration;  // 更新背景切换的时间
        if (isTransitioning) {
            transitionStartTime += pauseDuration;  // 更新过渡动画的开始时间
        }
        
        if (player && player.powerUpTimers) {
            Object.keys(player.powerUpTimers).forEach(type => {
                if (player.powerUpTimers[type + '_startTime']) {
                    player.powerUpTimers[type + '_startTime'] += pauseDuration;
                }
            });
        }
        isPaused = false;
        console.log('游戏已继续');
    }
}

// 添加新的绘制函数
function drawBackground() {
    const currentBackground = isDayTime ? dayBackground : nightBackground;
    const previousBackground = isDayTime ? nightBackground : dayBackground;
    
    if (isTransitioning) {
        ctx.globalAlpha = 1;
        ctx.drawImage(previousBackground, 0, backgroundY, canvas.width, canvas.height);
        ctx.drawImage(previousBackground, 0, backgroundY - canvas.height, canvas.width, canvas.height);
    }
    
    ctx.globalAlpha = isTransitioning ? backgroundTransitionProgress : 1;
    ctx.drawImage(currentBackground, 0, backgroundY, canvas.width, canvas.height);
    ctx.drawImage(currentBackground, 0, backgroundY - canvas.height, canvas.width, canvas.height);
    
    ctx.globalAlpha = 1;
}

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('双指点击继续', canvas.width / 2, canvas.height / 2 + 40);
    ctx.restore();
}

function drawGameInfo() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('V 2.2', canvas.width - 10, canvas.height - 5);
    ctx.fillText('阿爽战机', canvas.width - 45, canvas.height - 5); // 更靠右，与版本号保持更近的距离
    ctx.restore();
}

function updateExplosionParticles() {
    explosionParticles = explosionParticles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.02;
        
        if (particle.alpha > 0) {
            ctx.beginPath();
            ctx.fillStyle = particle.color.replace('hsl', 'hsla').replace(')', `, ${particle.alpha})`);
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }
        return false;
    });
}

// 修改画布大小设置
function initCanvas() {
    // 设置画布为全屏
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 根据屏幕大小调整游戏元素尺寸
    const scale = Math.min(canvas.width / 400, canvas.height / 600);
    
    // 调整玩家飞机大小
    Player.prototype.width = 50 * scale;
    Player.prototype.height = 50 * scale;
    
    // 调整子弹大小
    Bullet.prototype.width = 3 * scale;
    Bullet.prototype.height = 15 * scale;
    
    // 调整敌人大小
    Enemy.prototype.width = 40 * scale;
    Enemy.prototype.height = 40 * scale;
    
    // 调整道具大小
    PowerUp.prototype.radius = 12 * scale;
    
    // 调整分数道具大小
    ScoreItem.prototype.width = 15 * scale;
    ScoreItem.prototype.height = 15 * scale;
}

// 添加触摸事件监听
function initTouchControls() {
    // 移除鼠标事件监听
    canvas.removeEventListener('mousemove', null);
    
    // 添加触摸移动事件
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // 阻止页面滚动
        if (player && !isPaused) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            player.targetX = touchX - player.width / 2;
            player.targetY = touchY - player.height / 2;
        }
    }, { passive: false });
    
    // 添加触摸暂停控制
    canvas.addEventListener('touchend', (e) => {
        // 双指触摸结束时暂停/继续游戏
        if (e.touches.length === 0 && e.changedTouches.length === 2) {
            togglePause();
        }
    });
}

// 修改暂停菜单文字
function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('双指点击继续', canvas.width / 2, canvas.height / 2 + 40);
    ctx.restore();
}

// 修改清屏按钮位置和大小
function initClearScreenButton() {
    const clearScreenBtn = document.getElementById('clearScreenBtn');
    const btnSize = Math.min(canvas.width, canvas.height) * 0.15;
    
    clearScreenBtn.style.width = `${btnSize}px`;
    clearScreenBtn.style.height = `${btnSize}px`;
    clearScreenBtn.style.bottom = `${btnSize * 0.5}px`;
    clearScreenBtn.style.left = `${btnSize * 0.5}px`;
    
    // 创建闪电SVG图标
    const icon = clearScreenBtn.querySelector('.clear-screen-icon');
    icon.innerHTML = `
        <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" 
                  fill="#666666" 
                  stroke="#444" 
                  stroke-width="1"/>
        </svg>
    `;
    
    // 确保初始状态是灰色的
    const overlay = clearScreenBtn.querySelector('.cooldown-overlay');
    overlay.style.transform = 'scaleY(1)';
    clearScreenBtn.classList.remove('ready');
    
    // 添加触摸事件
    clearScreenBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        activateClearScreen();
    });
    
    // 更新冷却时间显示
    function updateCooldown() {
        if (!isPaused) {
            const currentTime = Date.now();
            const elapsed = currentTime - lastClearScreenTime;
            const progress = Math.min(elapsed / CLEAR_SCREEN_COOLDOWN, 1);
            
            const overlay = document.querySelector('.cooldown-overlay');
            overlay.style.transform = `scaleY(${1 - progress})`;
            
            if (progress >= 1 && !clearScreenReady) {
                clearScreenReady = true;
                const btn = document.getElementById('clearScreenBtn');
                btn.classList.add('ready');
                const icon = btn.querySelector('.clear-screen-icon svg path');
                icon.setAttribute('fill', 'yellow');
            }
        }
        requestAnimationFrame(updateCooldown);
    }
    updateCooldown();
}

// 在 DOMContentLoaded 时初始化移动端适配
document.addEventListener('DOMContentLoaded', () => {
    // 禁用默认的触摸行为
    document.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 初始化画布大小
    resizeCanvas();
    
    // 监听屏幕旋转和大小变化
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化触摸控制
    initTouchControls();
    
    // 其他初始化代码...
    initClearScreenButton();
    
    // 开始加载图片
    dayBackground.onload = checkAllImagesLoaded;
    nightBackground.onload = checkAllImagesLoaded;
    
    dayBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDA2NmZmIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDk5ZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2NmNjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
    nightBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDAwMDMzIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDAwNjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAwOTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
});

// 修改更新玩家位置函数
function updatePlayer() {
    // 平滑移动到目标位置
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    
    player.x += dx * 0.1;
    player.y += dy * 0.1;

    // 限制在画布范围内
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // 更新血条
    player.updateHealth();
}

// 生成敌人
function spawnEnemy() {
    if (Math.random() < 0.02) {
        enemies.push(new Enemy());
    }
}

// 碰撞检测
function checkCollisions() {
    // 检查分数道具碰撞
    scoreItems = scoreItems.filter(item => {
        if (item.x > player.x && 
            item.x < player.x + player.width &&
            item.y > player.y && 
            item.y < player.y + player.height) {
            score += item.value;
            scoreElement.textContent = score;
            return false;
        }
        return item.y < canvas.height;
    });

    // 检查道具碰撞和磁铁效果
    powerUps = powerUps.filter(powerUp => {
        if (player.hasMagnet) {
            const dx = player.x + player.width/2 - powerUp.x;
            const dy = player.y + player.height/2 - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                powerUp.x += dx * 0.1;
                powerUp.y += dy * 0.1;
            }
        }

        const dx = player.x + player.width/2 - powerUp.x;
        const dy = player.y + player.height/2 - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.width/2 + powerUp.radius) {
            player.activatePowerUp(powerUp.type);
            return false;
        }
        return powerUp.y < canvas.height;
    });

    enemies = enemies.filter(enemy => {
        // 检查敌人是否撞到玩家
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            if (!player.hasShield && !player.isInvincible) {
                player.health -= 20;
                player.healthBar.style.width = `${player.health}%`;
                if (player.bulletLevel > 1) {
                    player.bulletLevel--;
                }
                player.activateInvincible();
            }
            return false;
        }

        // 检查子弹是否击中敌人
        player.bullets = player.bullets.filter(bullet => {
            if (bullet.x > enemy.x && 
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y && 
                bullet.y < enemy.y + enemy.height) {
                enemy.health -= bullet.damage;
                if (enemy.health <= 0 && !enemy.isDying) {
                    enemy.isDying = true;
                    enemy.dropPowerUp();
                    scoreItems.push(new ScoreItem(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2
                    ));
                    score += 10;
                    scoreElement.textContent = score;
                }
                return false;
            }
            return true;
        });

        if (enemy.isDying) {
            return enemy.deathAlpha > 0;
        }
        return enemy.health > 0 && enemy.y < canvas.height;
    });
}

// 修改重置游戏函数
function resetGame() {
    // 重置游戏状态变量
    backgroundY = 0;
    score = 0;
    isGameOver = false;
    isPaused = false;
    isDayTime = true;
    lastBackgroundChange = Date.now();
    enemies = [];
    scoreItems = [];
    powerUps = [];
    clouds = [];
    explosionParticles = [];
    
    // 重置清屏buff状态
    lastClearScreenTime = Date.now();
    clearScreenReady = false;
    const clearScreenBtn = document.getElementById('clearScreenBtn');
    if (clearScreenBtn) {
        clearScreenBtn.classList.remove('ready');
        const icon = clearScreenBtn.querySelector('.clear-screen-icon');
        if (icon) {
            icon.setAttribute('fill', '#666666');
        }
        const overlay = clearScreenBtn.querySelector('.cooldown-overlay');
        if (overlay) {
            overlay.style.transform = 'scaleY(1)';
        }
    }
    
    // 重置玩家状态
    if (player) {
        player.health = 100;
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 20;
        player.targetX = player.x;
        player.targetY = player.y;
        player.bullets = [];
        player.bulletLevel = 1;
        player.hasShield = false;
        player.hasMagnet = false;
        player.healingParticles = [];
        player.shieldWaves = [];
        player.magnetParticles = [];
        player.weaponUpgradeParticles = [];
        player.weaponUpgradeRing = null;
        
        // 清除所有计时器
        Object.values(player.powerUpTimers).forEach(timer => clearTimeout(timer));
        player.powerUpTimers = {};
        
        if (player.autoShootInterval) {
            clearInterval(player.autoShootInterval);
        }
        player.startAutoShoot();
        
        // 重置无敌状态
        player.isInvincible = false;
        player.isVisible = true;
        if (player.invincibleTimer) {
            clearTimeout(player.invincibleTimer);
        }
        if (player.flashTimer) {
            clearInterval(player.flashTimer);
        }
        
        // 更新UI
        scoreElement.textContent = score;
        player.updateHealth();
    }
    
    // 取消现有的游戏循环
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    
    // 开始新的游戏循环
    gameLoop = requestAnimationFrame(gameUpdate);
}

// 修改清屏效果函数
function activateClearScreen() {
    if (!player || !clearScreenReady || isPaused) return;
    
    // 清除所有敌人
    enemies.forEach(enemy => {
        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        scoreItems.push(new ScoreItem(
            enemy.x + enemy.width/2,
            enemy.y + enemy.height/2
        ));
        score += 10;
    });
    enemies = [];
    
    // 重置冷却
    clearScreenReady = false;
    lastClearScreenTime = Date.now();
    const clearScreenBtn = document.getElementById('clearScreenBtn');
    clearScreenBtn.classList.remove('ready');
    const icon = clearScreenBtn.querySelector('.clear-screen-icon svg path');
    icon.setAttribute('fill', '#666666');
}

// 创建爆炸效果
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 2 + Math.random() * 3;
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 3 + Math.random() * 3,
            color: `hsl(${Math.random() * 30 + 10}, 100%, 50%)`
        };
        explosionParticles.push(particle);
    }
}

// 在游戏初始化时添加键盘事件监听
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'q') {
        activateClearScreen();
    }
});

// 在游戏开始时初始化清屏按钮
initClearScreenButton();

// 在 DOMContentLoaded 事件中设置事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化清屏按钮
    initClearScreenButton();
    
    // 开始加载图片
    dayBackground.onload = checkAllImagesLoaded;
    nightBackground.onload = checkAllImagesLoaded;
    
    dayBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDA2NmZmIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDk5ZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2NmNjZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
    nightBackground.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDAwMDMzIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMDAwNjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAwOTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==';
    
    // 添加鼠标控制
    canvas.addEventListener('mousemove', (e) => {
        if (player && !isPaused) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            player.targetX = mouseX - player.width / 2;
            player.targetY = mouseY - player.height / 2;
        }
    });

    // 添加清屏快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'q') {
            activateClearScreen();
        }
    });

    // 修改暂停事件监听器
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (!player) return;
        
        if (!isPaused) {
            // 暂停游戏
            pauseStartTime = Date.now();
            isPaused = true;
        } else {
            // 继续游戏
            const pauseDuration = Date.now() - pauseStartTime;
            // 更新所有需要暂停的计时器
            lastClearScreenTime += pauseDuration;
            lastBackgroundChange += pauseDuration;  // 更新背景切换的时间
            if (isTransitioning) {
                transitionStartTime += pauseDuration;  // 更新过渡动画的开始时间
            }
            
            if (player && player.powerUpTimers) {
                Object.keys(player.powerUpTimers).forEach(type => {
                    if (player.powerUpTimers[type + '_startTime']) {
                        player.powerUpTimers[type + '_startTime'] += pauseDuration;
                    }
                });
            }
            isPaused = false;
        }
    });
}); 