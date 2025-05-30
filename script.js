
const gameArea = document.getElementById('game-area');
const nave = document.getElementById('nave');
const placar = document.getElementById('placar');
const vidasDisplay = document.getElementById('vidas');
const somTiro = document.getElementById('som-tiro');
const somExplosao = document.getElementById('som-explosao');

let posX = window.innerWidth / 2;
let posY = window.innerHeight / 2;
const velocidade = 10;

let pontos = 0;
let vidas = 3;
let escudo = false;
let tiroDuplo = false;

let modoAuto = false;
let intervaloAuto = null;

let faseAtual = 1;
let inimigosDerrotados = 0;
let intervaloInimigos = null;
let intervaloPowerup = null;

document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowLeft') posX -= velocidade;
  if(e.key === 'ArrowRight') posX += velocidade;
  if(e.key === 'ArrowUp') posY -= velocidade;
  if(e.key === 'ArrowDown') posY += velocidade;

  posX = Math.max(0, Math.min(posX, window.innerWidth - 50));
  posY = Math.max(0, Math.min(posY, window.innerHeight - 50));

  nave.style.left = posX + 'px';
  nave.style.top = posY + 'px';

  if (e.code === 'Space' && !modoAuto) {
    dispararTiro(posX + 22.5, posY);
    if (tiroDuplo) dispararTiro(posX + 22.5 + 15, posY);
  }

  if (e.key === 'm' || e.key === 'M') {
    modoAuto = !modoAuto;
    console.log("Modo de disparo:", modoAuto ? "Automático" : "Manual");

    if (modoAuto) {
      intervaloAuto = setInterval(() => {
        dispararTiro(posX + 22.5, posY);
        if (tiroDuplo) dispararTiro(posX + 22.5 + 15, posY);
      }, 300);
    } else {
      clearInterval(intervaloAuto);
    }
  }
});

function dispararTiro(x, y) {
  const tiro = document.createElement('div');
  tiro.classList.add('tiro');
  tiro.style.left = x + 'px';
  tiro.style.top = y + 'px';
  gameArea.appendChild(tiro);
  somTiro.play();

  const intervalo = setInterval(() => {
    const posTop = parseInt(tiro.style.top);
    if (posTop <= 0) {
      tiro.remove();
      clearInterval(intervalo);
    } else {
      tiro.style.top = (posTop - 10) + 'px';
      detectarColisaoTiro(tiro);
    }
  }, 30);
}

function criarInimigo() {
  const inimigo = document.createElement('div');
  inimigo.classList.add('inimigo');
  const posX = Math.random() * (window.innerWidth - 40);
  inimigo.style.left = posX + 'px';
  inimigo.style.top = '0px';
  gameArea.appendChild(inimigo);

  const intervalo = setInterval(() => {
    const posTop = parseInt(inimigo.style.top);
    if (posTop >= window.innerHeight) {
      inimigo.remove();
      clearInterval(intervalo);
    } else {
      inimigo.style.top = (posTop + (3 + faseAtual)) + 'px';
      detectarColisaoNave(inimigo);
    }
  }, 50);
}

function criarPowerup() {
  const tipos = ['escudo', 'vida', 'tiro-duplo'];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];

  const powerup = document.createElement('div');
  powerup.classList.add('powerup');
  powerup.dataset.tipo = tipo;
  powerup.style.width = '30px';
  powerup.style.height = '30px';
  powerup.style.background = `url('./img/powerups.png') no-repeat center`;
  powerup.style.backgroundSize = 'cover';
  const posX = Math.random() * (window.innerWidth - 30);
  powerup.style.left = posX + 'px';
  powerup.style.top = '0px';
  gameArea.appendChild(powerup);

  const intervalo = setInterval(() => {
    const posTop = parseInt(powerup.style.top);
    if (posTop >= window.innerHeight) {
      powerup.remove();
      clearInterval(intervalo);
    } else {
      powerup.style.top = (posTop + 3) + 'px';
      detectarColisaoPowerup(powerup);
    }
  }, 50);
}

function detectarColisaoPowerup(powerup) {
  if (colidiu(powerup, nave)) {
    const tipo = powerup.dataset.tipo;
    powerup.remove();

    if (tipo === 'escudo') {
      escudo = true;
      nave.style.border = '2px solid cyan';
    } else if (tipo === 'vida') {
      vidas++;
      atualizarVidas();
    } else if (tipo === 'tiro-duplo') {
      tiroDuplo = true;
      setTimeout(() => { tiroDuplo = false; }, 5000);
    }
  }
}

function criarBoss() {
  const boss = document.createElement('div');
  boss.classList.add('boss');
  boss.dataset.vida = 10 + faseAtual * 5;
  boss.style.left = (window.innerWidth / 2 - 50) + 'px';
  boss.style.top = '0px';
  gameArea.appendChild(boss);

  const intervalo = setInterval(() => {
    const posTop = parseInt(boss.style.top);
    if (posTop >= window.innerHeight) {
      boss.remove();
      clearInterval(intervalo);
    } else {
      boss.style.top = (posTop + 2) + 'px';
      detectarColisaoNave(boss);
    }
  }, 50);
}

function detectarColisaoTiro(tiro) {
  const inimigos = document.querySelectorAll('.inimigo, .boss');
  inimigos.forEach(inimigo => {
    if (colidiu(tiro, inimigo)) {
      somExplosao.play();
      tiro.remove();

      if (inimigo.classList.contains('boss')) {
        inimigo.dataset.vida--;
        if (inimigo.dataset.vida <= 0) {
          inimigo.remove();
          pontos += 50;
          proximaFase();
        }
      } else {
        inimigo.remove();
        pontos += 10;
        inimigosDerrotados++;
        if (inimigosDerrotados >= 10 + faseAtual * 5) {
          criarBoss();
        }
      }

      atualizarPlacar();
    }
  });
}

function detectarColisaoNave(inimigo) {
  if (colidiu(inimigo, nave)) {
    inimigo.remove();
    if (escudo) {
      escudo = false;
      nave.style.border = 'none';
    } else {
      vidas--;
      atualizarVidas();
      if (vidas <= 0) {
        alert("Game Over! Sua pontuação: " + pontos);
        window.location.reload();
      }
    }
  }
}

function colidiu(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();
  return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
}

function atualizarPlacar() {
  placar.innerText = "Pontuação: " + pontos + " | Fase: " + faseAtual;
}

function atualizarVidas() {
  vidasDisplay.innerText = "Vidas: " + vidas;
}

function proximaFase() {
  faseAtual++;
  inimigosDerrotados = 0;
  clearInterval(intervaloInimigos);
  iniciarFase();
}

function iniciarFase() {
  intervaloInimigos = setInterval(criarInimigo, Math.max(2000 - faseAtual * 300, 500));
  intervaloPowerup = setInterval(criarPowerup, 10000);
}

iniciarFase();
