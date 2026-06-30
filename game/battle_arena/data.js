

    import * as THREE from 'three';
    let isChambering = false;
    let matchDifficulty = 'Normal';
    let diffIntervalMult = 1.0;
    let diffJitterMult = 1.0;
    let lastFootstepTime = 0;
    let playerSpreadAccum = 0.0;



    document.getElementById('btn-close-inv').addEventListener('touchstart', (e) => { 

      e.preventDefault(); 

      toggleInventory(); 

    });

    document.getElementById('btn-close-inv').addEventListener('click', () => { 

      toggleInventory(); 

    });





    document.addEventListener('contextmenu', event => event.preventDefault());

    const isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    

    function initPlaneSeatsUI() {

      const grid = document.getElementById('seats-grid');

      if (!grid) return;

      grid.innerHTML = '';

      

      for (let i = 0; i < 50; i++) {

        const dot = document.createElement('div');

        dot.id = `plane-seat-dot-${i}`;

        dot.style.width = '6px';

        dot.style.height = '6px';

        dot.style.borderRadius = '50%';

        dot.style.background = '#ff3333';

        dot.style.boxShadow = '0 0 4px #ff3333';

        dot.style.transition = 'all 0.3s ease';

        grid.appendChild(dot);

      }

    }



    function updatePlaneSeatsUI() {

      const seatMap = document.getElementById('plane-seat-map');

      if (!seatMap || gameState !== 'AIRPLANE') {

        if (seatMap) seatMap.style.display = 'none';

        return;

      }

      

      seatMap.style.display = 'flex';

      

      const playerInPlane = (gameState === 'AIRPLANE');

      let occupantsCount = playerInPlane ? 1 : 0;

      

      const playerSeatDot = document.getElementById('plane-seat-dot-0');

      if (playerSeatDot) {

        if (playerInPlane) {

          playerSeatDot.style.background = '#ffeb3b';

          playerSeatDot.style.boxShadow = '0 0 6px #ffeb3b';

        } else {

          playerSeatDot.style.background = 'rgba(255, 255, 255, 0.15)';

          playerSeatDot.style.boxShadow = 'none';

        }

      }

      

      for (let i = 0; i < 49; i++) {

        const enemy = enemies[i];

        const enemySeatDot = document.getElementById(`plane-seat-dot-${i + 1}`);

        if (enemy && enemySeatDot) {

          const inPlane = (enemy.state === 'IN_PLANE');

          if (inPlane) {

            occupantsCount++;

            enemySeatDot.style.background = '#ff3333';

            enemySeatDot.style.boxShadow = '0 0 4px #ff3333';

          } else {

            enemySeatDot.style.background = 'rgba(255, 255, 255, 0.15)';

            enemySeatDot.style.boxShadow = 'none';

          }

        }

      }

      

      const occupantsCountEl = document.getElementById('plane-occupants-count');

      if (occupantsCountEl) occupantsCountEl.innerText = occupantsCount;

    }



    if (isTouchDevice) {

      document.body.classList.add('touch-device');

      document.getElementById('loot-prompt').innerHTML = '📦 주변에 아이템이 있습니다. 줍기 버튼을 눌러 획득하세요!';

    }



    document.getElementById('loot-prompt').addEventListener('touchstart', (e) => {

      e.preventDefault();

      tryFastLoot();

    });

    document.getElementById('loot-prompt').addEventListener('click', () => {

      tryFastLoot();

    });





    // --- [사운드 시스템 (Web Audio API 기반 합성)] ---

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    let audioCtx = null;

    let sfxVolumeNode = null;

    

    let skydiveWindNode = null;

    let skydiveWindGain = null;

    let skydiveWindOsc = null;



    function initAudio() {

      if (audioCtx) {

        if (audioCtx.state === 'suspended') {

          audioCtx.resume();

        }

        return;

      }

      try {

        audioCtx = new AudioContext();

        sfxVolumeNode = audioCtx.createGain();

        sfxVolumeNode.gain.setValueAtTime(1.0, audioCtx.currentTime);

        sfxVolumeNode.connect(audioCtx.destination);

      } catch (e) {

        console.error("Web Audio API not supported", e);

      }

    }



    function getSfxDestination() {

      initAudio();

      return sfxVolumeNode || audioCtx.destination;

    }



    let bgmInterval = null;

    let bgmNodes = [];

    let planeNodes = [];

    let planePropellers = [];

    let planeNavLights = [];



    let bgmEnabled = false;

    let sfxEnabled = true;



    const SoundSystem = {

      playBGM() {

        if (!bgmEnabled) return;

        initAudio();

        if (!audioCtx) return;

        if (audioCtx.state === 'suspended') {

          audioCtx.resume();

        }

        this.stopBGM();



        try {

          const masterGain = audioCtx.createGain();

          masterGain.gain.setValueAtTime(0, audioCtx.currentTime);

          masterGain.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 3.0);

          masterGain.connect(audioCtx.destination);



          // 드론 베이스 (웅장한 긴장감)

          const droneOsc = audioCtx.createOscillator();

          droneOsc.type = 'sawtooth';

          droneOsc.frequency.setValueAtTime(41.20, audioCtx.currentTime); // E1

          const droneFilter = audioCtx.createBiquadFilter();

          droneFilter.type = 'lowpass';

          droneFilter.frequency.value = 140;

          const droneGain = audioCtx.createGain();

          droneGain.gain.value = 0.35;

          droneOsc.connect(droneFilter).connect(droneGain).connect(masterGain);

          droneOsc.start();

          bgmNodes.push(droneOsc, droneGain, droneFilter);



          // 타악기 및 오케스트라 효과 재생기

          const playImpact = (type = 'HIT', freq = 120) => {

            if (!audioCtx) return;

            const now = audioCtx.currentTime;

            

            if (type === 'HIT') {

                // 킥 드럼 펀치

                const kickOsc = audioCtx.createOscillator();

                kickOsc.type = 'sine';

                kickOsc.frequency.setValueAtTime(freq, now);

                kickOsc.frequency.exponentialRampToValueAtTime(10, now + 0.6);

                const kickGain = audioCtx.createGain();

                kickGain.gain.setValueAtTime(0.85, now);

                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

                kickOsc.connect(kickGain).connect(masterGain);

                kickOsc.start(now); kickOsc.stop(now + 0.6);

                

                // 브라스 찌르기 (Brass stab)

                const brassOsc = audioCtx.createOscillator();

                brassOsc.type = 'square';

                brassOsc.frequency.setValueAtTime(freq * 0.66, now); 

                const brassFilter = audioCtx.createBiquadFilter();

                brassFilter.type = 'lowpass';

                brassFilter.frequency.setValueAtTime(1800, now);

                brassFilter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

                const brassGain = audioCtx.createGain();

                brassGain.gain.setValueAtTime(0.2, now);

                brassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                brassOsc.connect(brassFilter).connect(brassGain).connect(masterGain);

                brassOsc.start(now); brassOsc.stop(now + 0.5);

            } else if (type === 'PERC') {

                // 노이즈 기반 타악기 (Snare/Rim)

                const bufferSize = audioCtx.sampleRate * 0.1;

                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

                const data = buffer.getChannelData(0);

                for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;

                const noise = audioCtx.createBufferSource();

                noise.buffer = buffer;

                const filter = audioCtx.createBiquadFilter();

                filter.type = 'bandpass'; filter.frequency.value = 1400;

                const g = audioCtx.createGain();

                g.gain.setValueAtTime(0.12, now);

                g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                noise.connect(filter).connect(g).connect(masterGain);

                noise.start(now);

            } else if (type === 'HAT') {

                // High-pass noise for hi-hat

                const bufferSize = audioCtx.sampleRate * 0.04;

                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

                const data = buffer.getChannelData(0);

                for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;

                const noise = audioCtx.createBufferSource();

                noise.buffer = buffer;

                const filter = audioCtx.createBiquadFilter();

                filter.type = 'highpass'; filter.frequency.value = 8000;

                const g = audioCtx.createGain();

                g.gain.setValueAtTime(0.04, now);

                g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

                noise.connect(filter).connect(g).connect(masterGain);

                noise.start(now);

            } else if (type === 'CHORD') {

                // 웅장한 패드 코드

                [freq, freq*1.2, freq*1.5].forEach(f => {

                    const osc = audioCtx.createOscillator();

                    osc.type = 'sawtooth'; osc.frequency.value = f * 0.5;

                    const lpf = audioCtx.createBiquadFilter();

                    lpf.type = 'lowpass'; lpf.frequency.value = 450;

                    const g = audioCtx.createGain();

                    g.gain.setValueAtTime(0, now);

                    g.gain.linearRampToValueAtTime(0.12, now + 0.6);

                    g.gain.linearRampToValueAtTime(0, now + 2.8);

                    osc.connect(lpf).connect(g).connect(masterGain);

                    osc.start(now); osc.stop(now + 2.8);

                });

            }

          };



          // 멜로디/베이스/리드 재생 헬퍼

          const playBass = (freq) => {

            if (!audioCtx) return;

            const now = audioCtx.currentTime;

            const osc = audioCtx.createOscillator();

            osc.type = 'sawtooth';

            osc.frequency.setValueAtTime(freq * 2.0, now);

            const filter = audioCtx.createBiquadFilter();

            filter.type = 'lowpass';

            filter.frequency.setValueAtTime(380, now);

            filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

            const gain = audioCtx.createGain();

            gain.gain.setValueAtTime(0.18, now);

            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(filter).connect(gain).connect(masterGain);

            osc.start(now); osc.stop(now + 0.18);

          };



          const playLead = (freq) => {

            if (!audioCtx) return;

            const now = audioCtx.currentTime;

            const osc1 = audioCtx.createOscillator();

            const osc2 = audioCtx.createOscillator();

            osc1.type = 'sawtooth';

            osc1.frequency.setValueAtTime(freq, now);

            osc2.type = 'triangle';

            osc2.frequency.setValueAtTime(freq * 1.005, now);

            const filter = audioCtx.createBiquadFilter();

            filter.type = 'bandpass';

            filter.frequency.setValueAtTime(1100, now);

            filter.Q.value = 1.0;

            const gain = audioCtx.createGain();

            gain.gain.setValueAtTime(0.08, now);

            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc1.connect(filter);

            osc2.connect(filter);

            filter.connect(gain).connect(masterGain);

            osc1.start(now); osc1.stop(now + 0.35);

            osc2.start(now); osc2.stop(now + 0.35);

          };



          const bassNotes = [

            41.20, 41.20, 48.99, 41.20, 55.00, 41.20, 48.99, 41.20,

            41.20, 41.20, 48.99, 41.20, 55.00, 41.20, 58.27, 41.20,

            32.70, 32.70, 38.89, 32.70, 43.65, 32.70, 38.89, 32.70,

            36.71, 36.71, 43.65, 36.71, 48.99, 36.71, 55.00, 48.99,

            36.71, 36.71, 43.65, 36.71, 48.99, 36.71, 43.65, 36.71,

            36.71, 36.71, 43.65, 36.71, 48.99, 36.71, 55.00, 36.71,

            48.99, 48.99, 58.27, 48.99, 65.41, 48.99, 58.27, 48.99,

            55.00, 55.00, 65.41, 55.00, 73.42, 65.41, 55.00, 41.20

          ];



          const leadNotes = [

            0, 0, 0, 0, 0, 0, 0, 0,

            0, 0, 0, 0, 0, 0, 0, 0,

            0, 0, 0, 0, 0, 0, 0, 0,

            0, 0, 0, 0, 0, 0, 0, 0,

            164.81, 0, 196.00, 220.00, 0, 246.94, 220.00, 196.00,

            164.81, 0, 196.00, 220.00, 0, 293.66, 246.94, 220.00,

            261.63, 0, 293.66, 329.63, 0, 392.00, 329.63, 293.66,

            293.66, 0, 329.63, 349.23, 0, 440.00, 392.00, 349.23

          ];



          let beatCount = 0;

          bgmInterval = setInterval(() => {

            const cycle = beatCount % 64;

            

            // 메인 킥 리듬

            if (cycle === 0 || cycle === 3 || cycle === 4 || cycle === 8 || cycle === 11 || cycle === 12 || 

                cycle === 16 || cycle === 19 || cycle === 20 || cycle === 24 || cycle === 27 || cycle === 28 ||

                cycle === 32 || cycle === 35 || cycle === 36 || cycle === 40 || cycle === 43 || cycle === 44 ||

                cycle === 48 || cycle === 51 || cycle === 52 || cycle === 56 || cycle === 59 || cycle === 60) {

              playImpact('HIT', cycle >= 32 ? 95 : 110);

            }

            

            // 박자감을 주는 추가 타악기 (Snare/Rim)

            if (cycle % 4 === 2 || cycle % 8 === 7) {

              playImpact('PERC');

            }



            // 하이햇 업비트

            if (cycle % 2 === 1) {

              playImpact('HAT');

            }



            // 드라이빙 베이스 런

            const bNote = bassNotes[cycle];

            if (bNote > 0) {

              playBass(bNote);

            }



            // 고조되는 부분의 리드 멜로디

            const lNote = leadNotes[cycle];

            if (lNote > 0) {

              playLead(lNote);

            }



            // 코드 연출 (16박자마다 오케스트라 패드)

            if (cycle === 0) playImpact('CHORD', 82.41);

            if (cycle === 16) playImpact('CHORD', 65.41);

            if (cycle === 32) playImpact('CHORD', 73.42);

            if (cycle === 48) playImpact('CHORD', 98.00);



            // 드론 피치 변주

            if (cycle === 0) droneOsc.frequency.exponentialRampToValueAtTime(41.20, audioCtx.currentTime + 0.8);

            if (cycle === 16) droneOsc.frequency.exponentialRampToValueAtTime(32.70, audioCtx.currentTime + 0.8);

            if (cycle === 32) droneOsc.frequency.exponentialRampToValueAtTime(36.71, audioCtx.currentTime + 0.8);

            if (cycle === 48) droneOsc.frequency.exponentialRampToValueAtTime(48.99, audioCtx.currentTime + 0.8);



            beatCount++;

          }, 240); // 240ms 간격으로 더 속도감 있고 힘찬 리듬

        } catch (err) {}

      },



      stopBGM() {

        if (bgmInterval) {

          clearInterval(bgmInterval);

          bgmInterval = null;

        }

        bgmNodes.forEach(node => {

          try { node.stop(); } catch(e) {}

          try { node.disconnect(); } catch(e) {}

        });

        bgmNodes = [];

      },



      playPlaneSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        

        if (audioCtx.state === 'suspended') {

          audioCtx.resume();

        }



        this.stopPlaneSound();

        try {

          const osc1 = audioCtx.createOscillator();

          const osc2 = audioCtx.createOscillator();

          const filter = audioCtx.createBiquadFilter();

          const gainNode = audioCtx.createGain();



          osc1.type = 'sawtooth';

          osc1.frequency.setValueAtTime(50, audioCtx.currentTime);

          

          osc2.type = 'sine';

          osc2.frequency.setValueAtTime(40, audioCtx.currentTime);



          filter.type = 'lowpass';

          filter.frequency.setValueAtTime(120, audioCtx.currentTime);



          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);



          osc1.connect(filter);

          osc2.connect(filter);

          filter.connect(gainNode);

          gainNode.connect(getSfxDestination());



          osc1.start();

          osc2.start();



          planeNodes.push(osc1, osc2, gainNode);

        } catch(e) {}

      },



      stopPlaneSound() {

        planeNodes.forEach(node => {

          try { node.stop(); } catch(e) {}

          try { node.disconnect(); } catch(e) {}

        });

        planeNodes = [];

      },



      playSkydiveWindSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        this.stopSkydiveWindSound();

        try {

          const bufferSize = audioCtx.sampleRate * 2.0;

          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

          const data = buffer.getChannelData(0);

          for (let i = 0; i < bufferSize; i++) {

            data[i] = Math.random() * 2 - 1;

          }

          

          const noise = audioCtx.createBufferSource();

          noise.buffer = buffer;

          noise.loop = true;

          

          const filter = audioCtx.createBiquadFilter();

          filter.type = 'lowpass';

          filter.frequency.setValueAtTime(400, audioCtx.currentTime);

          

          const osc = audioCtx.createOscillator();

          osc.type = 'sine';

          osc.frequency.setValueAtTime(1.5, audioCtx.currentTime);

          const oscGain = audioCtx.createGain();

          oscGain.gain.setValueAtTime(150, audioCtx.currentTime);

          

          osc.connect(oscGain);

          oscGain.connect(filter.frequency);

          

          const gain = audioCtx.createGain();

          gain.gain.setValueAtTime(0.001, audioCtx.currentTime);

          gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 1.0);

          

          noise.connect(filter).connect(gain).connect(getSfxDestination());

          

          osc.start();

          noise.start();

          

          skydiveWindNode = noise;

          skydiveWindGain = gain;

          skydiveWindOsc = osc;

        } catch(e) {}

      },



      stopSkydiveWindSound() {

        try {

          if (skydiveWindGain) {

            const now = audioCtx.currentTime;

            skydiveWindGain.gain.cancelScheduledValues(now);

            skydiveWindGain.gain.setValueAtTime(skydiveWindGain.gain.value, now);

            skydiveWindGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            const node = skydiveWindNode;

            const osc = skydiveWindOsc;

            setTimeout(() => {

              try { node.stop(); node.disconnect(); } catch(e) {}

              try { osc.stop(); osc.disconnect(); } catch(e) {}

            }, 350);

          }

        } catch(e) {}

        skydiveWindNode = null;

        skydiveWindGain = null;

        skydiveWindOsc = null;

      },



      playParachuteSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        this.stopSkydiveWindSound();

        

        const now = audioCtx.currentTime;

        try {

          const osc = audioCtx.createOscillator();

          const gain = audioCtx.createGain();

          osc.type = 'triangle';

          osc.frequency.setValueAtTime(320, now);

          osc.frequency.exponentialRampToValueAtTime(75, now + 0.8);

          

          gain.gain.setValueAtTime(0.35, now);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          

          const filter = audioCtx.createBiquadFilter();

          filter.type = 'lowpass';

          filter.frequency.setValueAtTime(300, now);

          

          osc.connect(filter).connect(gain).connect(getSfxDestination());

          osc.start(now);

          osc.stop(now + 0.8);

          

          for (let i = 0; i < 4; i++) {

            const burstTime = now + i * 0.12;

            const dur = 0.25;

            

            const bufferSize = audioCtx.sampleRate * dur;

            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

            const data = buffer.getChannelData(0);

            for (let j = 0; j < bufferSize; j++) {

              data[j] = Math.random() * 2 - 1;

            }

            

            const noise = audioCtx.createBufferSource();

            noise.buffer = buffer;

            

            const nFilter = audioCtx.createBiquadFilter();

            nFilter.type = 'bandpass';

            nFilter.frequency.setValueAtTime(400 - i * 50, burstTime);

            nFilter.Q.setValueAtTime(2.0, burstTime);

            

            const nGain = audioCtx.createGain();

            nGain.gain.setValueAtTime(0, burstTime);

            nGain.gain.linearRampToValueAtTime(0.20 - i * 0.03, burstTime + 0.05);

            nGain.gain.exponentialRampToValueAtTime(0.001, burstTime + dur);

            

            noise.connect(nFilter).connect(nGain).connect(getSfxDestination());

            noise.start(burstTime);

            noise.stop(burstTime + dur);

          }

        } catch(e) {}

      },

      playDryClick() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        try {

          const osc = audioCtx.createOscillator();

          const gain = audioCtx.createGain();

          osc.type = 'sine';

          osc.frequency.setValueAtTime(1600, now);

          osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

          gain.gain.setValueAtTime(0.08, now);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain).connect(audioCtx.destination);

          osc.start(now); osc.stop(now + 0.04);

        } catch(e) {}

      },



      playReloadSound(weaponName) {
        if (!sfxEnabled) return;
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        try {
          const playClick = (time, freq, dur, vol) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq / 2, time + dur);
            gain.gain.setValueAtTime(vol * 0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain).connect(getSfxDestination());
            osc.start(time); osc.stop(time + dur);
          };

          const playNoiseClick = (time, freq, dur, vol) => {
            const bufferSize = audioCtx.sampleRate * dur;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(freq, time);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(vol * 0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            noise.connect(filter).connect(gain).connect(getSfxDestination());
            noise.start(time); noise.stop(time + dur);
          };

          if (weaponName === '권총') {
            playClick(now, 850, 0.08, 0.12);
            playClick(now + 0.18, 1150, 0.10, 0.15);
          } else if (weaponName === '돌격소총') {
            playClick(now, 450, 0.10, 0.15);
            playClick(now + 0.22, 350, 0.12, 0.12);
            playClick(now + 0.48, 550, 0.08, 0.14);
            playClick(now + 0.65, 800, 0.08, 0.18);
          } else if (weaponName === '저격총') {
            playClick(now, 320, 0.12, 0.18);
            playClick(now + 0.25, 250, 0.15, 0.14);
            playClick(now + 0.50, 480, 0.10, 0.16);
            playClick(now + 0.72, 350, 0.12, 0.20);
          } else if (weaponName === '샷건') {
            playNoiseClick(now, 350, 0.15, 0.15);
            playNoiseClick(now + 0.35, 550, 0.12, 0.18);
            playNoiseClick(now + 0.52, 280, 0.10, 0.22);
          } else {
            playClick(now, 600, 0.10, 0.08);
          }
        } catch(e) {}
      },
      playGunshot(weaponId, volume = 1.0, pan = 0) {
        if (!sfxEnabled) return;
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          
          const bufferSize = audioCtx.sampleRate * 1.5;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = audioCtx.createBufferSource();
          noise.buffer = buffer;
          const nGain = audioCtx.createGain();
          const nFilter = audioCtx.createBiquadFilter();

          const panner = audioCtx.createPanner();
          panner.panningModel = 'HRTF';
          panner.setPosition(pan, 0, -1);

          if (weaponId === 'SNIPER') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(15, now);
            osc.frequency.exponentialRampToValueAtTime(1, now + 1.2);
            gain.gain.setValueAtTime(volume * 1.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            nFilter.type = 'lowpass';
            nFilter.frequency.setValueAtTime(2500, now);
            nFilter.Q.setValueAtTime(1.5, now);
            nGain.gain.setValueAtTime(volume * 1.5, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

            osc.connect(gain).connect(panner);
            noise.connect(nFilter).connect(nGain).connect(panner);
            osc.start(now); osc.stop(now + 1.2);
            noise.start(now); noise.stop(now + 1.4);
          } else if (weaponId === 'SHOTGUN') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.35);
            gain.gain.setValueAtTime(volume * 1.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            nFilter.type = 'bandpass';
            nFilter.frequency.setValueAtTime(1000, now);
            nFilter.frequency.exponentialRampToValueAtTime(100, now + 0.45);
            nGain.gain.setValueAtTime(volume * 1.6, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain).connect(panner);
            noise.connect(nFilter).connect(nGain).connect(panner);
            osc.start(now); osc.stop(now + 0.35);
            noise.start(now); noise.stop(now + 0.5);
          } else if (weaponId === 'RIFLE') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.18);
            gain.gain.setValueAtTime(volume * 0.95, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            nFilter.type = 'bandpass';
            nFilter.frequency.setValueAtTime(2000, now);
            nFilter.Q.setValueAtTime(1.0, now);
            nGain.gain.setValueAtTime(volume * 0.85, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain).connect(panner);
            noise.connect(nFilter).connect(nGain).connect(panner);
            osc.start(now); osc.stop(now + 0.18);
            noise.start(now); noise.stop(now + 0.25);
          } else if (weaponId === 'PISTOL') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
            gain.gain.setValueAtTime(volume * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            nFilter.type = 'bandpass';
            nFilter.frequency.setValueAtTime(3200, now);
            nGain.gain.setValueAtTime(volume * 0.45, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain).connect(panner);
            noise.connect(nFilter).connect(nGain).connect(panner);
            osc.start(now); osc.stop(now + 0.12);
            noise.start(now); noise.stop(now + 0.15);
          }
          panner.connect(getSfxDestination());
        } catch(e) {}
      },
      playPainSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        try {

          const osc = audioCtx.createOscillator();

          const gain = audioCtx.createGain();

          osc.type = 'sawtooth';

          // "윽" 소리: 낮은 주파수에서 급격히 떨어지는 음

          osc.frequency.setValueAtTime(120, now);

          osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

          

          gain.gain.setValueAtTime(0.3, now);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          

          const filter = audioCtx.createBiquadFilter();

          filter.type = 'lowpass';

          filter.frequency.value = 400;



          osc.connect(filter);

          filter.connect(gain);

          gain.connect(getSfxDestination());

          osc.start(now);

          osc.stop(now + 0.2);

        } catch(e) {}

      },



      playExplosion(volume = 1.0) {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          const bufferSize = audioCtx.sampleRate * 1.2;

          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

          const data = buffer.getChannelData(0);

          for (let i = 0; i < bufferSize; i++) {

            data[i] = Math.random() * 2 - 1;

          }



          const noise = audioCtx.createBufferSource();

          noise.buffer = buffer;



          const lp = audioCtx.createBiquadFilter();

          lp.type = 'lowpass';

          lp.frequency.setValueAtTime(500, now);

          lp.frequency.exponentialRampToValueAtTime(50, now + 0.9);



          const gain = audioCtx.createGain();

          gain.gain.setValueAtTime(0.7 * volume, now);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);



          noise.connect(lp);

          lp.connect(gain);

          gain.connect(getSfxDestination());

          noise.start(now);

          noise.stop(now + 1.2);



          const sub = audioCtx.createOscillator();

          const subGain = audioCtx.createGain();

          sub.type = 'sine';

          sub.frequency.setValueAtTime(70, now);

          sub.frequency.exponentialRampToValueAtTime(20, now + 0.35);

          subGain.gain.setValueAtTime(0.9 * volume, now);

          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);



          sub.connect(subGain);

          subGain.connect(getSfxDestination());

          sub.start(now);

          sub.stop(now + 0.35);

        } catch (e) {}

      },



      playSmokeHiss(volume = 1.0) {

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          const bufferSize = audioCtx.sampleRate * 2.0;

          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);

          const data = buffer.getChannelData(0);

          for (let i = 0; i < bufferSize; i++) {

            data[i] = Math.random() * 2 - 1;

          }



          const noise = audioCtx.createBufferSource();

          noise.buffer = buffer;



          const hp = audioCtx.createBiquadFilter();

          hp.type = 'highpass';

          hp.frequency.setValueAtTime(2200, now);



          const gain = audioCtx.createGain();

          gain.gain.setValueAtTime(0.12 * volume, now);

          gain.gain.linearRampToValueAtTime(0.08 * volume, now + 0.5);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);



          noise.connect(hp);

          hp.connect(gain);

          gain.connect(getSfxDestination());



          noise.start(now);

          noise.stop(now + 2.0);

        } catch (e) {}

      },



      playPunch(isHit) {

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          if (!isHit) {

            const osc = audioCtx.createOscillator();

            const gain = audioCtx.createGain();

            osc.type = 'triangle';

            osc.frequency.setValueAtTime(320, now);

            osc.frequency.exponentialRampToValueAtTime(90, now + 0.10);

            gain.gain.setValueAtTime(0.15, now);

            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);



            osc.connect(gain);

            gain.connect(getSfxDestination());

            osc.start(now);

            osc.stop(now + 0.10);

          } else {

            const osc = audioCtx.createOscillator();

            const gain = audioCtx.createGain();

            osc.type = 'sine';

            osc.frequency.setValueAtTime(110, now);

            osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

            gain.gain.setValueAtTime(0.4, now);

            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);



            osc.connect(gain);

            gain.connect(getSfxDestination());

            osc.start(now);

            osc.stop(now + 0.12);



            const clickOsc = audioCtx.createOscillator();

            const clickGain = audioCtx.createGain();

            clickOsc.type = 'triangle';

            clickOsc.frequency.setValueAtTime(900, now);

            clickOsc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

            clickGain.gain.setValueAtTime(0.2, now);

            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);



            clickOsc.connect(clickGain);

            clickGain.connect(getSfxDestination());

            clickOsc.start(now);

            clickOsc.stop(now + 0.04);

          }

        } catch (e) {}

      },



      playFootstep(isSprinting) {
        if (!sfxEnabled) return;
        initAudio();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        try {
          const dur = isSprinting ? 0.08 : 0.11;
          const vol = isSprinting ? 0.045 : 0.025;

          const bufferSize = audioCtx.sampleRate * dur;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = audioCtx.createBufferSource();
          noise.buffer = buffer;

          const filter = audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(3500, now);
          filter.Q.setValueAtTime(3.0, now);

          const gain = audioCtx.createGain();
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(vol, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

          noise.connect(filter).connect(gain).connect(getSfxDestination());
          noise.start(now); noise.stop(now + dur);
        } catch(e) {}
      },
      playHealSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          const frequencies = [330, 440, 554, 659];

          frequencies.forEach((freq, idx) => {

            const osc = audioCtx.createOscillator();

            const gain = audioCtx.createGain();

            osc.type = 'sine';

            osc.frequency.setValueAtTime(freq, now + idx * 0.12);



            gain.gain.setValueAtTime(0, now + idx * 0.12);

            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);

            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);



            osc.connect(gain);

            gain.connect(getSfxDestination());

            osc.start(now + idx * 0.12);

            osc.stop(now + idx * 0.12 + 0.3);

          });

        } catch (e) {}

      },



      playLootSound() {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          const osc = audioCtx.createOscillator();

          const gain = audioCtx.createGain();

          osc.type = 'triangle';

          osc.frequency.setValueAtTime(550, now);

          osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);



          gain.gain.setValueAtTime(0.05, now);

          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);



          osc.connect(gain);

          gain.connect(getSfxDestination());

          osc.start(now);

          osc.stop(now + 0.08);

        } catch (e) {}

      },



      playMatchEndSound(isVictory) {

        if (!sfxEnabled) return;

        initAudio();

        if (!audioCtx) return;

        const now = audioCtx.currentTime;



        try {

          if (isVictory) {

            const notes = [261.63, 329.63, 392.00, 523.25];

            notes.forEach((freq, idx) => {

              const osc = audioCtx.createOscillator();

              const gain = audioCtx.createGain();

              osc.type = 'sawtooth';

              osc.frequency.setValueAtTime(freq, now + idx * 0.14);



              const filter = audioCtx.createBiquadFilter();

              filter.type = 'lowpass';

              filter.frequency.setValueAtTime(750, now + idx * 0.14);



              gain.gain.setValueAtTime(0, now + idx * 0.14);

              gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.14 + 0.05);

              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.7);



              osc.connect(filter);

              filter.connect(gain);

              gain.connect(getSfxDestination());



              osc.start(now + idx * 0.14);

              osc.stop(now + idx * 0.14 + 0.75);

            });

          } else {

            const osc = audioCtx.createOscillator();

            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';

            osc.frequency.setValueAtTime(110, now);

            osc.frequency.linearRampToValueAtTime(35, now + 1.4);



            const filter = audioCtx.createBiquadFilter();

            filter.type = 'lowpass';

            filter.frequency.setValueAtTime(180, now);



            gain.gain.setValueAtTime(0.2, now);

            gain.gain.linearRampToValueAtTime(0.001, now + 1.4);



            osc.connect(filter);

            filter.connect(gain);

            gain.connect(getSfxDestination());



            osc.start(now);

            osc.stop(now + 1.4);

          }

        } catch (e) {}

      }

    };



    // 무기 밸런스 설정

    const WEAPONS = { 

      PUNCH: { name: '주먹', range: 4, dmg: 20 }, 

      PISTOL: { name: '권총', range: 30, dmg: 18 }, 

      SHOTGUN: { name: '샷건', range: 15, dmg: 80 },

      RIFLE: { name: '돌격소총', range: 120, dmg: 35 },

      SNIPER: { name: '저격총', range: 300, dmg: 90 }

    };

    // 스코프 설정

    const SCOPES = {

      NONE: { name: '기계식 조준기', mag: 1 },

      X2: { name: '2배율 스코프', mag: 2 },

      X4: { name: '4배율 스코프', mag: 4 },

      X8: { name: '8배율 스코프', mag: 8 }

    };

    // 헬멧 및 가방 설정

    const HELMETS = {

      LV1: { name: '헬멧 Level 1', reduction: 0.30 },

      LV2: { name: '헬멧 Level 2', reduction: 0.40 },

      LV3: { name: '헬멧 Level 3', reduction: 0.55 }

    };

    const BAGS = {

      LV1: { name: '가방 Level 1', capacity: 5 },

      LV2: { name: '가방 Level 2', capacity: 8 },

      LV3: { name: '가방 Level 3', capacity: 12 }

    };



    // 파밍용 상자/아이템 생성 풀 (다양한 장비 및 투척무기 포함)

    const wPool = [WEAPONS.PISTOL, WEAPONS.SHOTGUN, WEAPONS.RIFLE, WEAPONS.SNIPER];

    const sPool = [SCOPES.X2, SCOPES.X4, SCOPES.X8];

    const hPool = [HELMETS.LV1, HELMETS.LV2, HELMETS.LV3];

    const bPool = [BAGS.LV1, BAGS.LV2, BAGS.LV3];



    // 플레이어 인벤토리 상태

    const playerInventory = {

      weapon: WEAPONS.PUNCH,

      scope: SCOPES.NONE,

      helmet: null,

      bag: null,

      grenades: 0,

      smokes: 0,

      firstaids: 0,

      ammo: {

        PISTOL: 0,

        SHOTGUN: 0,

        RIFLE: 0,

        SNIPER: 0

      },

      loadedAmmo: {

        PISTOL: 0,

        SHOTGUN: 0,

        RIFLE: 0,

        SNIPER: 0

      }

    };



    const enemies = []; const lootBoxes = []; const enemyBullets = [];

    const recentGunshots = []; const liveChickens = [];



    // --- [1. 씬 생성] ---

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x71a5d4); 

    scene.fog = new THREE.FogExp2(0x71a5d4, 0.003); 



    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2500);

    camera.position.set(0, 150, 0);



    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.fog = new THREE.FogExp2(0xcce0ff, 0.0018);

    document.body.appendChild(renderer.domElement);



    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x4f6d4f, 0.6);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);

    sun.position.set(200, 300, 100); sun.castShadow = true;

    sun.shadow.camera.left = -300; sun.shadow.camera.right = 300; sun.shadow.camera.top = 300; sun.shadow.camera.bottom = -300;

    sun.shadow.camera.near = 0.5;

    sun.shadow.camera.far = 1000;

    sun.shadow.mapSize.width = 2048;

    sun.shadow.mapSize.height = 2048;

    sun.shadow.bias = -0.0008;

    scene.add(sun);







    // --- [건물 위치 사전 결정 및 지형 평탄화 설계] ---

    const buildingSpots = [];

    const windowSpots = [];

    const doorsList = [];

    

    // 맵 내에 겹치지 않는 건물 부지 생성 (25개 건물)

    const numBuildings = 25;

    for (let i = 0; i < numBuildings; i++) {

      let x = 0, z = 0, w = 15, d = 15, ok = false;

      for (let retries = 0; retries < 150; retries++) {

        x = (Math.random() - 0.5) * 440;

        z = (Math.random() - 0.5) * 440;

        w = 14 + Math.random() * 14; // 너비 14~28m

        d = 14 + Math.random() * 14; // 깊이 14~28m

        

        let overlap = false;

        // 건물은 맵 중심 210m 안전 건조 영역 내부에서만 생성하여 해수면 잠김 원천 차단

        if (Math.sqrt(x*x + z*z) > 210) overlap = true;

        // 시작 스폰 지역이나 맵 중앙 근처에 너무 가깝지 않도록 안전 여유

        if (Math.sqrt(x*x + z*z) < 30) overlap = true;

        // 연못 구역 침범 원천 차단 (건물의 대각선이나 중심이 연못 범위에 겹치지 않게 여유 6m 적용)

        const distToPond1 = Math.sqrt((x - 60)**2 + (z - 80)**2);

        if (distToPond1 < 25 + Math.max(w, d)/2 + 6.0) overlap = true;

        const distToPond2 = Math.sqrt((x + 80)**2 + (z + 60)**2);

        if (distToPond2 < 20 + Math.max(w, d)/2 + 6.0) overlap = true;

        

        // 건물 간 최소 30m 이상 거리 유지 (밀도 향상)

        if (!overlap) {

          for (let j = 0; j < buildingSpots.length; j++) {

            const other = buildingSpots[j];

            const dist = Math.sqrt((x - other.x)**2 + (z - other.z)**2);

            const minD = Math.max(w, d)/2 + Math.max(other.w, other.d)/2 + 20;

            if (dist < minD) { overlap = true; break; }

          }

        }

        

        if (!overlap) { ok = true; break; }

      }

      if (ok) {

        const distFromCenter = Math.sqrt(x*x + z*z);

        const baseNoise = Math.sin(x / 40) * 4 + Math.cos(z / 35) * 3 + Math.sin((x + z) / 20) * 2 + 13.5;

        

        // 실제 자연 지형처럼 불규칙한 섬 윤곽선 형성 (각도에 따른 노이즈 추가)

        const angle = Math.atan2(z, x);

        const borderNoise = Math.sin(angle * 3.0) * 25.0 + Math.cos(angle * 5.0) * 15.0 + Math.sin(angle * 8.0) * 8.0;

        const islandRadius = 230.0 + borderNoise;



        let radialFade = 1.0;

        if (distFromCenter > islandRadius) {

          radialFade = Math.max(0, 1.0 - (distFromCenter - islandRadius) / 50);

        }

        let spotY = baseNoise * radialFade - (1.0 - radialFade) * 18;

        

        const distToPond1 = Math.sqrt((x - 60)*(x - 60) + (z - 80)*(z - 80));

        if (distToPond1 < 25) {

          const pondFactor = Math.max(0, 1 - distToPond1 / 25);

          spotY -= pondFactor * pondFactor * 8.0;

        }

        const distToPond2 = Math.sqrt((x + 80)*(x + 80) + (z + 60)*(z + 60));

        if (distToPond2 < 20) {

          const pondFactor = Math.max(0, 1 - distToPond2 / 20);

          spotY -= pondFactor * pondFactor * 7.0;

        }

        if (distFromCenter < 25) {

          const factor = Math.max(0, (distFromCenter - 12) / 13);

          spotY = THREE.MathUtils.lerp(13.5, spotY, factor);

        }

        buildingSpots.push({ x, z, w, d, y: spotY, seed: Math.random() });

      }

    }



    function getWaterLevel(x, z) {

      if (isNaN(x) || isNaN(z)) return WATER_LEVEL;

      const distToPond1 = Math.sqrt((x - 60)*(x - 60) + (z - 80)*(z - 80));

      if (distToPond1 < 25) {

        return 14.5;

      }

      const distToPond2 = Math.sqrt((x + 80)*(x + 80) + (z + 60)*(z + 60));

      if (distToPond2 < 20) {

        return 6.5;

      }

      return WATER_LEVEL;

    }



    function getElevation(x, z, currentY = null) {

      if (isNaN(x) || isNaN(z)) return 0;

      

      const distFromCenter = Math.sqrt(x*x + z*z);

      const rawY = Math.sin(x / 40) * 4 + Math.cos(z / 35) * 3 + Math.sin((x + z) / 20) * 2 + 13.5;

      

      // 실제 자연 지형처럼 불규칙한 섬 윤곽선 형성 (각도에 따른 노이즈 추가)

      const angle = Math.atan2(z, x);

      const borderNoise = Math.sin(angle * 3.0) * 25.0 + Math.cos(angle * 5.0) * 15.0 + Math.sin(angle * 8.0) * 8.0;

      const islandRadius = 230.0 + borderNoise;

      

      // 바다로 내려앉는 경계 감쇄 연산 (islandRadiusm 이상부터 서서히 감소하여 islandRadius + 50m에서 해저에 도달)

      let radialFade = 1.0;

      if (distFromCenter > islandRadius) {

        radialFade = Math.max(0, 1.0 - (distFromCenter - islandRadius) / 50);

      }

      let terrainY = rawY * radialFade - (1.0 - radialFade) * 18;



      // 맵 내부의 연못(Pond) 구역 감쇄 연산 (2개의 연못 추가)

      const distToPond1 = Math.sqrt((x - 60)*(x - 60) + (z - 80)*(z - 80));

      if (distToPond1 < 25) {

        const pondFactor = Math.max(0, 1 - distToPond1 / 25);

        terrainY -= pondFactor * pondFactor * 8.0; // 연못 중심 깊이 8m

      }



      const distToPond2 = Math.sqrt((x + 80)*(x + 80) + (z + 60)*(z + 60));

      if (distToPond2 < 20) {

        const pondFactor = Math.max(0, 1 - distToPond2 / 20);

        terrainY -= pondFactor * pondFactor * 7.0; // 연못 중심 깊이 7m

      }



      if (distFromCenter < 25) {

        const factor = Math.max(0, (distFromCenter - 12) / 13);

        terrainY = THREE.MathUtils.lerp(13.5, terrainY, factor);

      }

      

      for (let i = 0; i < buildingSpots.length; i++) {

        const spot = buildingSpots[i];

        const margin = 7.0; 

        const hw = spot.w / 2;

        const hd = spot.d / 2;

        const rampW = 1.5;

        

        if (x >= spot.x - hw - rampW - 0.4 && x <= spot.x - hw && z >= spot.z - hd && z <= spot.z + hd) {

          const t = (z - (spot.z - hd)) / spot.d;

          return spot.y + 0.1 + t * 5.05;

        }

        

        if (x >= spot.x - hw && x <= spot.x + hw && z >= spot.z - hd && z <= spot.z + hd) {

          const hasY = (currentY !== null && currentY !== false);

          const onRoof = hasY && (currentY >= spot.y + 1.7);

          if (onRoof || currentY === null) {

            return spot.y + 5.15; 

          }

          return spot.y + 0.1;

        }

        

        if (x >= spot.x - hw - margin && x <= spot.x + hw + margin && z >= spot.z - hd - margin && z <= spot.z + hd + margin) {

          const dx = Math.abs(x - spot.x);

          const dz = Math.abs(z - spot.z);

          const factorX = Math.max(0, Math.min(1, (hw + margin - dx) / margin));

          const factorZ = Math.max(0, Math.min(1, (hd + margin - dz) / margin));

          const factor = factorX * factorZ;

          return THREE.MathUtils.lerp(terrainY, spot.y + 0.1, factor);

        }

      }

      return terrainY;

    }



    const WATER_LEVEL = -4.0;

    const mapSize = 600;

    const groundGeo = new THREE.PlaneGeometry(mapSize, mapSize, 200, 200);

    groundGeo.rotateX(-Math.PI / 2); 

    const posAttr = groundGeo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) posAttr.setY(i, getElevation(posAttr.getX(i), posAttr.getZ(i), false)); 

    groundGeo.computeVertexNormals();



    // 지형 경사 및 높이에 따른 버텍스 컬러 연산 (실감나는 전장 지형 연출)

    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {

      const vx = posAttr.getX(i);

      const vz = posAttr.getZ(i);

      const vy = posAttr.getY(i);

      

      // 경사도(Slope) 근사 계산

      const eps = 1.0;

      const hL = getElevation(vx - eps, vz, false);

      const hR = getElevation(vx + eps, vz, false);

      const hD = getElevation(vx, vz - eps, false);

      const hU = getElevation(vx, vz + eps, false);

      const slope = Math.sqrt((hR - hL)*(hR - hL) + (hU - hD)*(hU - hD)) / (2 * eps);

      

      // 기본 잔디 색상 (Rich Green)

      let r = 0.22, g = 0.38, b = 0.16;

      

      if (vy < 0.0) {

        // 물밑 지질: 짙은 흙/모래 색상

        r = 0.28; g = 0.23; b = 0.16;

      } else if (slope > 0.45) {

        // 급경사: 암석 절벽 색상 (Grey)

        r = 0.35 + Math.sin(vx*0.5)*0.03;

        g = 0.35 + Math.sin(vx*0.5)*0.03;

        b = 0.35 + Math.sin(vx*0.5)*0.03;

      } else if (slope > 0.15) {

        // 중경사: 흙/언덕 색상 (Brownish Dirt)

        r = 0.32 + Math.cos(vz*0.5)*0.02;

        g = 0.27 + Math.cos(vz*0.5)*0.02;

        b = 0.18 + Math.cos(vz*0.5)*0.02;

      } else {

        // 완만함: 잔디 톤 다양화 노이즈

        const noise = Math.sin(vx * 0.08) * Math.cos(vz * 0.08) * 0.04;

        r += noise;

        g += noise * 1.2;

        b += noise * 0.8;

        

        // 로비 센터 주변 (25m 반경): 연한 황토/베이지색 군사 진지 느낌으로 보정

        const distFromCenter = Math.sqrt(vx*vx + vz*vz);

        if (distFromCenter < 25) {

          const factor = Math.max(0, (25 - distFromCenter) / 25);

          r = THREE.MathUtils.lerp(r, 0.44, factor);

          g = THREE.MathUtils.lerp(g, 0.40, factor);

          b = THREE.MathUtils.lerp(b, 0.30, factor);

        }

      }

      

      // 고지대: 설산 캡 연출 (Snow-capped Peak)

      if (vy > 11.0) {

        const snowFactor = Math.min(1.0, (vy - 11.0) / 7.0);

        r = THREE.MathUtils.lerp(r, 0.90, snowFactor);

        g = THREE.MathUtils.lerp(g, 0.92, snowFactor);

        b = THREE.MathUtils.lerp(b, 0.95, snowFactor);

      }

      

      colors[i * 3] = r;

      colors[i * 3 + 1] = g;

      colors[i * 3 + 2] = b;

    }

    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));



    function createNoiseTexture(width = 256, height = 256) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = 185 + Math.random() * 70;
        data[i] = n;
        data[i+1] = n;
        data[i+2] = n;
        data[i+3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(160, 160);
      return texture;
    }
    const groundNoiseTex = createNoiseTexture();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ 
      vertexColors: true, 
      map: groundNoiseTex,
      roughness: 0.98,
      metalness: 0.02
    }));

    ground.receiveShadow = true; scene.add(ground);



    // 바다 평면 (Water Circle Plane) 추가 - 원형으로 제작하고 크기를 대폭 늘려(반지름 6000) 수평선 경계가 안개 속으로 자연스레 흐려지도록 처리

    const waterGeo = new THREE.CircleGeometry(6000, 64);

    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({ 

      color: 0x1d3f5e, 

      roughness: 0.15, 

      metalness: 0.85, 

      transparent: true, 

      opacity: 0.85,

      depthWrite: true

    });

    const water = new THREE.Mesh(waterGeo, waterMat);

    water.position.y = WATER_LEVEL;

    scene.add(water);



    // 맵 내부에 실제 물이 들어차 있는 연못 2개 물 평면(Circle) 추가

    const pond1Geo = new THREE.CircleGeometry(25, 32);

    pond1Geo.rotateX(-Math.PI / 2);

    const pondWaterMat = new THREE.MeshStandardMaterial({

      color: 0x1d4d5e,

      roughness: 0.2,

      metalness: 0.7,

      transparent: true,

      opacity: 0.78,

      depthWrite: true

    });

    const pond1Water = new THREE.Mesh(pond1Geo, pondWaterMat);

    pond1Water.position.set(60, 14.5, 80);

    scene.add(pond1Water);



    const pond2Geo = new THREE.CircleGeometry(20, 32);

    pond2Geo.rotateX(-Math.PI / 2);

    const pond2Water = new THREE.Mesh(pond2Geo, pondWaterMat);

    pond2Water.position.set(-80, 6.5, -60);

    scene.add(pond2Water);



    const treeGeoCone = new THREE.ConeGeometry(2.5, 8, 8); const treeGeoTrunk = new THREE.CylinderGeometry(0.5, 0.5, 3);

    const treeMatCone = new THREE.MeshStandardMaterial({ color: 0x243d18 }); const treeMatTrunk = new THREE.MeshStandardMaterial({ color: 0x3d2c18 });

    const houseMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });



    // --- [건물 및 자연 장애물 스폰 엔진 (비중첩 설계)] ---

    const obstacles = [];



    // 1. 15개의 buildingSpots에 정교한 건물 및 내부 인테리어 스폰

    buildingSpots.forEach((spot, idx) => {

      const x = spot.x;

      const z = spot.z;

      const w = spot.w;

      const d = spot.d;

      const y = spot.y;

      const bH = 5.0; // 건물 높이

      const wallThick = 0.4;

      

      const buildingGroup = new THREE.Group();

      buildingGroup.position.set(x, y, z);

      

      // 건물 컬러/스타일 다양화 (주택, 금속창고, 벽돌막사)

      let bMat;

      const styleSeed = spot.seed;

      if (styleSeed < 0.4) {

        // 주거용 주택

        const rColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.2, 0.4 + Math.random()*0.2);

        bMat = new THREE.MeshStandardMaterial({ color: rColor, roughness: 0.8 });

      } else if (styleSeed < 0.7) {

        // 산업용 금속 창고

        bMat = new THREE.MeshStandardMaterial({ color: 0x4f5d65, metalness: 0.8, roughness: 0.3 });

      } else {

        // 군사용 붉은 벽돌 막사

        bMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.9 });

      }

      const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 }); // 목재 바닥 느낌

      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3d3025, roughness: 0.8 });

      const colMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });



      // 1) 바닥 및 천장(지붕) 생성

      const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), floorMat);

      floor.position.y = 0.1;

      floor.receiveShadow = true;

      buildingGroup.add(floor);



      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.3, d + 0.8), roofMat);

      roof.position.y = bH + 0.15;

      roof.castShadow = true;

      buildingGroup.add(roof);



      // 천장용 대들보/구조용 보강 보 (Ceiling Beams) 추가 (목재 디테일)

      const beamMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 });

      // 메인 대들보 (X축 방향)

      const beamX = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.22, 0.22), beamMat);

      beamX.position.set(0, bH - 0.11, 0);

      beamX.castShadow = true;

      buildingGroup.add(beamX);



      // 횡방향 들보 세트 (X축 방향으로 등간격 배치하여 건물 내부 공간에 온전히 수용)

      for (let bx = -w/3; bx <= w/3 + 0.1; bx += w/3) {

        const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, d - 0.2), beamMat);

        beamZ.position.set(bx, bH - 0.18, 0);

        beamZ.castShadow = true;

        buildingGroup.add(beamZ);

      }



      // 건물 로컬 벽 충돌 박스를 기록할 임시 배열

      const localWalls = [];



      // 2) 벽 조립 및 창문/문 구멍 비우기

      // 남쪽 벽 (z = d/2) - 문 1개 설치

      const doorW = (styleSeed >= 0.4 && styleSeed < 0.7) ? 4.0 : 2.2;

      const doorH = 3.4;

      const sW_south = (w - doorW) / 2;

      

      // 남쪽 왼쪽 벽

      const sWallLeft = new THREE.Mesh(new THREE.BoxGeometry(sW_south, bH, wallThick), bMat);

      sWallLeft.position.set(-w/2 + sW_south/2, bH/2, d/2 - wallThick/2);

      sWallLeft.castShadow = true; sWallLeft.receiveShadow = true;

      buildingGroup.add(sWallLeft);

      localWalls.push({ minX: -w/2, maxX: -w/2 + sW_south, minZ: d/2 - wallThick, maxZ: d/2 });



      // 남쪽 오른쪽 벽

      const sWallRight = new THREE.Mesh(new THREE.BoxGeometry(sW_south, bH, wallThick), bMat);

      sWallRight.position.set(w/2 - sW_south/2, bH/2, d/2 - wallThick/2);

      sWallRight.castShadow = true; sWallRight.receiveShadow = true;

      buildingGroup.add(sWallRight);

      localWalls.push({ minX: w/2 - sW_south, maxX: w/2, minZ: d/2 - wallThick, maxZ: d/2 });



      // 남쪽 문 위쪽 벽

      const sWallTop = new THREE.Mesh(new THREE.BoxGeometry(doorW, bH - doorH, wallThick), bMat);

      sWallTop.position.set(0, doorH + (bH - doorH)/2, d/2 - wallThick/2);

      sWallTop.castShadow = true;

      buildingGroup.add(sWallTop);



      // 3) 문 피벗 및 회전형 나무 문 생성 (창고인 경우 넓은 개방형 입구로 유지하고 문을 달지 않음)

      if (!(styleSeed >= 0.4 && styleSeed < 0.7)) {

        const doorPivot = new THREE.Group();

        doorPivot.position.set(doorW/2, 0.1, d/2 - wallThick/2);

        buildingGroup.add(doorPivot);



        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH - 0.1, 0.15), new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 }));

        doorMesh.position.set(-doorW/2, (doorH - 0.1)/2, 0);

        doorMesh.castShadow = true;

        doorPivot.add(doorMesh);



        // 문고리 (Brass Door Knob) 추가: 내외 측면에 둥근 구형 노브로 부착하여 튀어나온 막대 느낌 제거 (doorMesh 로컬 좌표계 기준으로 위치 보정)

        const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

        

        const handleOuter = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handleMat);

        handleOuter.position.set(-doorW/2 + 0.15, 0, 0.10);

        doorMesh.add(handleOuter);



        const handleInner = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handleMat);

        handleInner.position.set(-doorW/2 + 0.15, 0, -0.10);

        doorMesh.add(handleInner);



        const doorWorldPos = new THREE.Vector3(x + doorW/2, y + 0.1, z + d/2 - wallThick/2);

        doorsList.push({

          pivot: doorPivot,

          x: x, 

          z: z + d/2 - wallThick/2,

          w: doorW,

          d: wallThick,

          isOpen: false,

          worldPos: doorWorldPos

        });

      }



      // 북쪽 벽 (z = -d/2) - 창문 2개 설치

      const winW = 2.0;

      const winH = 1.8;

      const winY = 1.0; // 창문 밑단 높이

      const sW_north = (w - winW * 2) / 3;



      // 북쪽 벽 3개의 수직 기둥부

      const nWallLeft = new THREE.Mesh(new THREE.BoxGeometry(sW_north, bH, wallThick), bMat);

      nWallLeft.position.set(-w/2 + sW_north/2, bH/2, -d/2 + wallThick/2);

      nWallLeft.castShadow = true; nWallLeft.receiveShadow = true;

      buildingGroup.add(nWallLeft);

      localWalls.push({ minX: -w/2, maxX: -w/2 + sW_north, minZ: -d/2, maxZ: -d/2 + wallThick });



      const nWallMid = new THREE.Mesh(new THREE.BoxGeometry(sW_north, bH, wallThick), bMat);

      nWallMid.position.set(0, bH/2, -d/2 + wallThick/2);

      nWallMid.castShadow = true; nWallMid.receiveShadow = true;

      buildingGroup.add(nWallMid);

      localWalls.push({ minX: -sW_north/2, maxX: sW_north/2, minZ: -d/2, maxZ: -d/2 + wallThick });



      const nWallRight = new THREE.Mesh(new THREE.BoxGeometry(sW_north, bH, wallThick), bMat);

      nWallRight.position.set(w/2 - sW_north/2, bH/2, -d/2 + wallThick/2);

      nWallRight.castShadow = true; nWallRight.receiveShadow = true;

      buildingGroup.add(nWallRight);

      localWalls.push({ minX: w/2 - sW_north, maxX: w/2, minZ: -d/2, maxZ: -d/2 + wallThick });



      // 북쪽 창문 밑 벽 2개

      for (let wIdx = 0; wIdx < 2; wIdx++) {

        const posX = wIdx === 0 ? -w/2 + sW_north + winW/2 : w/2 - sW_north - winW/2;

        const nWallBottom = new THREE.Mesh(new THREE.BoxGeometry(winW, winY, wallThick), bMat);

        nWallBottom.position.set(posX, winY/2, -d/2 + wallThick/2);

        nWallBottom.castShadow = true; nWallBottom.receiveShadow = true;

        buildingGroup.add(nWallBottom);

        localWalls.push({ minX: posX - winW/2, maxX: posX + winW/2, minZ: -d/2, maxZ: -d/2 + wallThick });



        // 창문 윗 벽

        const nWallTop = new THREE.Mesh(new THREE.BoxGeometry(winW, bH - winY - winH, wallThick), bMat);

        nWallTop.position.set(posX, winY + winH + (bH - winY - winH)/2, -d/2 + wallThick/2);

        nWallTop.castShadow = true;

        buildingGroup.add(nWallTop);



        // 창문 파쿠르 위치 등록

        windowSpots.push({

          x: x + posX,

          y: y + winY + winH/2,

          z: z - d/2 + wallThick/2,

          angle: -Math.PI / 2

        });

      }



      // 동쪽 벽 (x = w/2) - 창문 1개 설치

      const sH_east = (d - winW) / 2;

      const eWallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bH, sH_east), bMat);

      eWallLeft.position.set(w/2 - wallThick/2, bH/2, -d/2 + sH_east/2);

      eWallLeft.castShadow = true; eWallLeft.receiveShadow = true;

      buildingGroup.add(eWallLeft);

      localWalls.push({ minX: w/2 - wallThick, maxX: w/2, minZ: -d/2, maxZ: -d/2 + sH_east });



      const eWallRight = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bH, sH_east), bMat);

      eWallRight.position.set(w/2 - wallThick/2, bH/2, d/2 - sH_east/2);

      eWallRight.castShadow = true; eWallRight.receiveShadow = true;

      buildingGroup.add(eWallRight);

      localWalls.push({ minX: w/2 - wallThick, maxX: w/2, minZ: d/2 - sH_east, maxZ: d/2 });



      // 동쪽 창문 밑 벽 및 위 벽

      const eWallBottom = new THREE.Mesh(new THREE.BoxGeometry(wallThick, winY, winW), bMat);

      eWallBottom.position.set(w/2 - wallThick/2, winY/2, 0);

      eWallBottom.castShadow = true; eWallBottom.receiveShadow = true;

      buildingGroup.add(eWallBottom);

      localWalls.push({ minX: w/2 - wallThick, maxX: w/2, minZ: -winW/2, maxZ: winW/2 });



      const eWallTop = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bH - winY - winH, winW), bMat);

      eWallTop.position.set(w/2 - wallThick/2, winY + winH + (bH - winY - winH)/2, 0);

      eWallTop.castShadow = true;

      buildingGroup.add(eWallTop);



      // 동쪽 창문 파쿠르 위치 등록

      windowSpots.push({

        x: x + w/2 - wallThick/2,

        y: y + winY + winH/2,

        z: z,

        angle: 0

      });



      // 서쪽 벽 (x = -w/2) - 전체 통벽

      const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bH, d), bMat);

      wWall.position.set(-w/2 + wallThick/2, bH/2, 0);

      wWall.castShadow = true; wWall.receiveShadow = true;

      buildingGroup.add(wWall);

      localWalls.push({ minX: -w/2, maxX: -w/2 + wallThick, minZ: -d/2, maxZ: d/2 });



      // 4) 내부 기둥 4개 배치

      const colW = 0.6;

      const colPositions = [

        { cx: -w/4, cz: -d/4 },

        { cx: w/4, cz: -d/4 },

        { cx: -w/4, cz: d/4 },

        { cx: w/4, cz: d/4 }

      ];

      colPositions.forEach(pos => {

        const col = new THREE.Mesh(new THREE.BoxGeometry(colW, bH, colW), colMat);

        col.position.set(pos.cx, bH/2, pos.cz);

        col.castShadow = true; col.receiveShadow = true;

        buildingGroup.add(col);

        localWalls.push({ minX: pos.cx - colW/2, maxX: pos.cx + colW/2, minZ: pos.cz - colW/2, maxZ: pos.cz + colW/2 });

      });



      // 5) 내부 칸막이벽 (방 입구 문틀 공간 확보를 위해 가로 칸막이를 2.2m 단축)

      const partW = (w/2 + w/6) - 2.2;

      const partWallH = new THREE.Mesh(new THREE.BoxGeometry(partW, bH, 0.25), bMat);

      partWallH.position.set(-w/2 + partW/2, bH/2, 0);

      partWallH.castShadow = true; partWallH.receiveShadow = true;

      buildingGroup.add(partWallH);

      localWalls.push({ minX: -w/2, maxX: -w/2 + partW, minZ: -0.125, maxZ: 0.125 });



      const partD = d/2;

      const partWallV = new THREE.Mesh(new THREE.BoxGeometry(0.25, bH, partD), bMat);

      partWallV.position.set(w/6, bH/2, -d/4);

      partWallV.castShadow = true; partWallV.receiveShadow = true;

      buildingGroup.add(partWallV);

      localWalls.push({ minX: w/6 - 0.125, maxX: w/6 + 0.125, minZ: -d/2, maxZ: 0 });



      // 6) 건물 서쪽 경사로(Ramp) 및 안전 난간 생성 (옥상 진입용)

      const rampW = 1.5;

      const rampLength = Math.sqrt(d * d + bH * bH);

      const rampAngle = Math.atan2(bH, d);

      

      const ramp = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.2, rampLength), floorMat);

      ramp.position.set(-w/2 - rampW/2, bH/2 + 0.1, 0);

      ramp.rotation.x = -rampAngle;

      ramp.castShadow = true; ramp.receiveShadow = true;

      buildingGroup.add(ramp);

      

      const handrailMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.2 });

      const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, rampLength), handrailMat);

      handrail.position.set(-w/2 - rampW, bH/2 + 0.5, 0);

      handrail.rotation.x = -rampAngle;

      handrail.castShadow = true;

      buildingGroup.add(handrail);



      // 7) obstacles 등록

      scene.add(buildingGroup);



      const worldWalls = localWalls.map(lw => ({

        minX: x + lw.minX,

        maxX: x + lw.maxX,

        minZ: z + lw.minZ,

        maxZ: z + lw.maxZ

      }));

      obstacles.push({ type: 'BUILDING', walls: worldWalls, spotX: x, spotZ: z, spotY: y, w: w, d: d });



      // 7) 건물 내부에 풍부한 확정 파밍 아이템 스폰 (각 건물당 4개)

      const itemSpots = [

        new THREE.Vector3(-w/3, 0.2, -d/3),

        new THREE.Vector3(w/3, 0.2, -d/3),

        new THREE.Vector3(0, 0.2, d/3),

        new THREE.Vector3(w/3, 0.2, d/3)

      ];

      itemSpots.forEach(localSpot => {

        const itemWorldPos = new THREE.Vector3(x + localSpot.x, y + localSpot.y, z + localSpot.z);

        const rVal = Math.random();

        

        if (rVal < 0.3) {

          const weapon = wPool[Math.floor(Math.random() * wPool.length)];

          spawnGroundItem(itemWorldPos, 'WEAPON', weapon);

          

          const wKey = weapon.name === '권총' ? 'PISTOL' : (weapon.name === '샷건' ? 'SHOTGUN' : (weapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));

          const offsetPos = itemWorldPos.clone().add(new THREE.Vector3((Math.random()-0.5)*1.8, 0, (Math.random()-0.5)*1.8));

          spawnGroundItem(offsetPos, 'AMMO_' + wKey, { name: getAmmoName(wKey) });

        } else if (rVal < 0.45) {

          spawnGroundItem(itemWorldPos, 'SCOPE', sPool[Math.floor(Math.random() * sPool.length)]);

        } else if (rVal < 0.6) {

          spawnGroundItem(itemWorldPos, 'HELMET', hPool[Math.floor(Math.random() * hPool.length)]);

        } else if (rVal < 0.7) {

          spawnGroundItem(itemWorldPos, 'BAG', bPool[Math.floor(Math.random() * bPool.length)]);

        } else if (rVal < 0.8) {

          spawnGroundItem(itemWorldPos, 'FIRSTAID', { name: '구급상자' });

        } else if (rVal < 0.9) {

          spawnGroundItem(itemWorldPos, 'GRENADE', { name: '수류탄' });

        } else {

          spawnGroundItem(itemWorldPos, 'SMOKE', { name: '연막탄' });

        }

      });



      // 8) 옥상(Rooftop) 아이템 스폰 (각 건물당 2개 추가)

      for (let rIdx = 0; rIdx < 2; rIdx++) {

        const rx = (Math.random() - 0.5) * (w - 2.0);

        const rz = (Math.random() - 0.5) * (d - 2.0);

        const roofItemPos = new THREE.Vector3(x + rx, y + 5.3, z + rz); // 옥상 높이 보정

        

        const rVal = Math.random();

        if (rVal < 0.4) {

          const weapon = wPool[Math.floor(Math.random() * wPool.length)];

          spawnGroundItem(roofItemPos, 'WEAPON', weapon);

          const wKey = weapon.name === '권총' ? 'PISTOL' : (weapon.name === '샷건' ? 'SHOTGUN' : (weapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));

          const offsetPos = roofItemPos.clone().add(new THREE.Vector3((Math.random()-0.5)*1.8, 0, (Math.random()-0.5)*1.8));

          spawnGroundItem(offsetPos, 'AMMO_' + wKey, { name: getAmmoName(wKey) });

        } else if (rVal < 0.7) {

          spawnGroundItem(roofItemPos, 'SCOPE', sPool[Math.floor(Math.random() * sPool.length)]);

        } else {

          spawnGroundItem(roofItemPos, 'FIRSTAID', { name: '구급상자' });

        }

      }

    });



    // 2. 나무, 바위, 덤불 비중첩 스폰 루프 (밀도 향상 및 다양성 확보)

    const numObstacles = 300;

    for (let i = 0; i < numObstacles; i++) {

      let x = 0, z = 0, radius = 1.0, obsType = 'TREE', ok = false;

      

      for (let retries = 0; retries < 150; retries++) {

        x = (Math.random() - 0.5) * 520;

        z = (Math.random() - 0.5) * 520;

        

        const randVal = Math.random();

        if (randVal < 0.55) {

          obsType = 'TREE';

          const scale = 0.6 + Math.random() * 1.8;

          radius = 0.95 * scale;

        } else if (randVal < 0.82) {

          obsType = 'BUSH';

          const scale = 0.8 + Math.random() * 1.2;

          radius = 1.1 * scale;

        } else {

          obsType = 'ROCK';

          const scale = 1.8 + Math.random() * 3.2; // 바위 크기 대폭 확장 및 무작위성 확대

          radius = scale * 1.1;

        }



        let overlap = false;



        // 중앙 로비 근처 안전구역 및 바닷물 침수 구역(230m 외부) 스폰 원천 차단

        const distFromC = Math.sqrt(x*x + z*z);

        if (distFromC < 25 || distFromC > 230) { overlap = true; }

        

        // 연못 구역 내부 또는 경계(여유 2.5m) 스폰 제한

        const distToPond1 = Math.sqrt((x - 60)**2 + (z - 80)**2);

        if (distToPond1 < 25 + radius + 2.5) { overlap = true; }

        const distToPond2 = Math.sqrt((x + 80)**2 + (z + 60)**2);

        if (distToPond2 < 20 + radius + 2.5) { overlap = true; }



        if (!overlap) {

          for (let b = 0; b < buildingSpots.length; b++) {

            const spot = buildingSpots[b];

            const dx = Math.abs(x - spot.x);

            const dz = Math.abs(z - spot.z);

            if (dx < spot.w/2 + radius + 4.5 && dz < spot.d/2 + radius + 4.5) {

              overlap = true;

              break;

            }

          }

        }



        if (!overlap) {

          for (let o = 0; o < obstacles.length; o++) {

            const other = obstacles[o];

            const dist = Math.sqrt((x - other.x)**2 + (z - other.z)**2);

            if (dist < radius + other.radius + 3.0) {

              overlap = true;

              break;

            }

          }

        }



        if (!overlap) {

          ok = true;

          break;

        }

      }



      if (ok) {

        const y = getElevation(x, z);



        if (obsType === 'TREE') {

          const scale = radius / 0.95;

          const trunk = new THREE.Mesh(treeGeoTrunk, treeMatTrunk);

          trunk.position.set(x, y + 1.5 * scale, z);

          trunk.castShadow = true; trunk.receiveShadow = true;

          trunk.scale.set(scale, scale, scale);



          const treeType = Math.floor(Math.random() * 3);

          let leaves;

          if (treeType === 0) {

            leaves = new THREE.Group();

            const leaves1 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.2, 8), treeMatCone);

            leaves1.position.set(0, 2.4, 0);

            leaves1.castShadow = true;

            leaves.add(leaves1);

            const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.5, 8), treeMatCone);

            leaves2.position.set(0, 3.9, 0);

            leaves2.castShadow = true;

            leaves.add(leaves2);

            const leaves3 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 8), treeMatCone);

            leaves3.position.set(0, 5.2, 0);

            leaves3.castShadow = true;

            leaves.add(leaves3);

          } else if (treeType === 1) {

            leaves = new THREE.Group();

            const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e5c1e, roughness: 0.9 });

            const centerSphere = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), leafMat);

            centerSphere.position.set(0, 3.2, 0);

            centerSphere.castShadow = true;

            leaves.add(centerSphere);

            const offsets = [

              [0.8, 3.6, 0.4, 1.0],

              [-0.8, 3.4, -0.5, 0.95],

              [0.5, 2.9, -0.8, 0.85],

              [-0.6, 2.8, 0.6, 0.9],

              [0.0, 4.0, -0.2, 1.1]

            ];

            offsets.forEach(([ox, oy, oz, oscale]) => {

              const oLeaf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 * oscale, 1), leafMat);

              oLeaf.position.set(ox, oy, oz);

              oLeaf.castShadow = true;

              leaves.add(oLeaf);

            });

          } else {

            leaves = new THREE.Group();

            const mapleMat = new THREE.MeshStandardMaterial({ color: 0xd3a03e, roughness: 0.9 });

            const centerSphere = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), mapleMat);

            centerSphere.position.set(0, 2.9, 0);

            centerSphere.castShadow = true;

            leaves.add(centerSphere);

            const offsets = [

              [0.7, 3.3, 0.4, 0.9],

              [-0.7, 3.1, -0.4, 0.9],

              [0.4, 2.6, -0.7, 0.8],

              [-0.5, 2.5, 0.5, 0.85],

              [0.0, 3.7, -0.2, 1.05]

            ];

            offsets.forEach(([ox, oy, oz, oscale]) => {

              const oLeaf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0 * oscale, 1), mapleMat);

              oLeaf.position.set(ox, oy, oz);

              oLeaf.castShadow = true;

              leaves.add(oLeaf);

            });

          }

          trunk.add(leaves);

          scene.add(trunk);

          obstacles.push({ type: 'TREE', x: x, z: z, radius: radius });

        } else if (obsType === 'BUSH') {

          // 덤불 (BUSH) - 부드러운 장애물 (콜리전 미해결, 시각화만 적용 - 반투명 처리로 엄폐 불가 인지 개선)

          const bushGroup = new THREE.Group();

          bushGroup.position.set(x, y, z);

          const bushMat = new THREE.MeshStandardMaterial({ color: 0x1b4322, roughness: 0.95, transparent: true, opacity: 0.65 });

          const numPuffs = 4 + Math.floor(Math.random() * 3);

          for (let p = 0; p < numPuffs; p++) {

            const pSize = radius * (0.5 + Math.random() * 0.5);

            const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(pSize, 1), bushMat);

            puff.position.set(

              (Math.random() - 0.5) * radius * 0.8,

              pSize * 0.4,

              (Math.random() - 0.5) * radius * 0.8

            );

            puff.castShadow = true;

            puff.receiveShadow = true;

            bushGroup.add(puff);

          }

          scene.add(bushGroup);

          // 장애물 목록에는 추가하여 겹침 방지 적용

          obstacles.push({ type: 'BUSH', x: x, z: z, radius: radius * 1.1 });

        } else {

          // 대형 다중 파트 바위 더미 (Rock Pile)

          const scale = radius / 1.15;

          const rockGroup = new THREE.Group();

          rockGroup.position.set(x, y, z);

          

          const rockMat = new THREE.MeshStandardMaterial({ color: 0x757d75, roughness: 0.8, metalness: 0.1 });

          const numRocks = 3 + Math.floor(Math.random() * 3);

          for (let r = 0; r < numRocks; r++) {

            const rSize = scale * (0.8 + Math.random() * 1.0);

            const subRock = new THREE.Mesh(new THREE.DodecahedronGeometry(rSize), rockMat);

            

            subRock.position.set(

              (Math.random() - 0.5) * scale * 1.1,

              rSize * 0.35 + (Math.random() * 0.25) * scale,

              (Math.random() - 0.5) * scale * 1.1

            );

            subRock.rotation.set(

              Math.random() * Math.PI,

              Math.random() * Math.PI,

              Math.random() * Math.PI

            );

            subRock.castShadow = true;

            subRock.receiveShadow = true;

            rockGroup.add(subRock);

          }

          scene.add(rockGroup);

          obstacles.push({ type: 'ROCK', x: x, z: z, radius: radius });

        }

      }

    }



    // --- [3D 휴머노이드 캐릭터 & 총기 렌더링 시스템] ---

    function createSoldierModel(camoColorHex = 0x3d5c3d, skinColorHex = 0xffccaa) {

      const group = new THREE.Group();

      group.rotation.order = 'YXZ'; // YXZ 순서로 회전하여 낙하시 옆구리가 아닌 배가 바닥을 향하도록 설정

      

      const camoMat = new THREE.MeshStandardMaterial({ color: camoColorHex, roughness: 0.8 });

      const skinMat = new THREE.MeshStandardMaterial({ color: skinColorHex, roughness: 0.8 });

      const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e2f1e, roughness: 0.9, side: THREE.DoubleSide });

      const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a3e2a });



      // 몸통 세분화 그룹 (가슴, 허리, 전술 벨트)

      const body = new THREE.Group();

      body.position.y = 0.95;

      group.add(body);



      // 1) 상부 가슴 메쉬 (Tactical Vest 느낌)

      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.35, 0.28), camoMat);

      chest.position.y = 0.18; // 로컬 위치 (월드 Y: 0.95 + 0.18 = 1.13)

      chest.castShadow = true; chest.receiveShadow = true;

      body.add(chest);



      // 방탄판/파우치 디테일

      const vestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 }));

      vestPlate.position.set(0, 0, -0.155);

      chest.add(vestPlate);



      // 2) 유연한 허리 메쉬

      const waist = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.25), pantsMat);

      waist.position.y = -0.07; // 로컬 위치 (월드 Y: 0.95 - 0.07 = 0.88)

      waist.castShadow = true; waist.receiveShadow = true;

      body.add(waist);



      // 3) 골반 및 전술 벨트 메쉬

      const beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.26), beltMat);

      belt.position.y = -0.22; // 로컬 위치 (월드 Y: 0.95 - 0.22 = 0.73)

      belt.castShadow = true; belt.receiveShadow = true;

      body.add(belt);



      // 4) 하부 골반/엉덩이 메쉬 (바지 색상과 연동하여 다리와 몸통을 연결)

      const hips = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.24), pantsMat);

      hips.position.y = -0.32; // 로컬 위치 (월드 Y: 0.95 - 0.32 = 0.63, 다리가 붙은 0.60과 오버랩되어 틈새 방지)

      hips.castShadow = true; hips.receiveShadow = true;

      body.add(hips);



      // 해커용 붉은 몸통 텍스처 등 외부 대입 호환을 위한 material 프로퍼티 재정의

      Object.defineProperty(body, 'material', {

        get() { return chest.material; },

        set(m) {

          chest.material = m;

          waist.material = m;

          belt.material = m;

          hips.material = m;

        }

      });



      // 머리 & 헬멧

      const headGroup = new THREE.Group();

      headGroup.position.set(0, 1.45, 0);

      

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);

      head.castShadow = true;

      headGroup.add(head);

      

      // 얼굴 이목구비 추가 (눈, 코, 입)

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x992222 });

      

      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);

      leftEye.position.set(-0.07, 0.05, -0.19);

      headGroup.add(leftEye);

      

      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);

      rightEye.position.set(0.07, 0.05, -0.19);

      headGroup.add(rightEye);

      

      // 코 원뿔 뾰족한 부분이 밖(정면: -Z)을 향하도록 회전값 -Math.PI / 2 로 수정

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 4), skinMat);

      nose.rotation.x = -Math.PI / 2;

      nose.position.set(0, 0.0, -0.23);

      headGroup.add(nose);

      

      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.006), mouthMat);

      mouth.position.set(0, -0.07, -0.208);

      headGroup.add(mouth);



      // 귀(Ears) 추가

      const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.025), skinMat);

      leftEar.position.set(-0.23, 0.02, 0);

      leftEar.rotation.y = 0.12;

      headGroup.add(leftEar);



      const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.025), skinMat);

      rightEar.position.set(0.23, 0.02, 0);

      rightEar.rotation.y = -0.12;

      headGroup.add(rightEar);



      // 헤어캡/머리카락(Hair) 추가

      const hairMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.85 });

      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);

      hair.position.set(0, 0.03, 0.02);

      hair.rotation.x = 0.18;

      headGroup.add(hair);

      

      // 헬멧 (눈을 가리지 않도록 후방으로 약간 밀고 뒤로 기울여 개방감 확보)

      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);

      helmet.position.set(0, 0.07, 0.02);

      helmet.rotation.x = 0.12; // 양수값으로 회전하여 뒤쪽으로 비스듬히 기울임

      helmet.castShadow = true;

      helmet.visible = false; // 기본은 착용 안 함

      headGroup.add(helmet);



      // 레벨 3 헬멧 바이저 (기울어진 헬멧 각도에 연동하여 비스듬히 앞쪽으로 정렬)

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.11, 0.09), new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.2}));

      visor.position.set(0, 0.06, -0.21);

      visor.rotation.x = 0.12;

      visor.visible = false;

      headGroup.add(visor);

      

      group.add(headGroup);



      // 관절형 팔 (위팔 + 아래팔 구조)

      function createArm(mat, px, py, pz) {

        const armGroup = new THREE.Group();

        armGroup.position.set(px, py, pz);



        // 위팔 (Upper Arm)

        const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), mat);

        upperArm.position.y = -0.125;

        upperArm.castShadow = true;

        upperArm.receiveShadow = true;

        armGroup.add(upperArm);



        // 어깨 보호대 (Shoulder Pad) 추가

        const padMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });

        const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.15), padMat);

        shoulderPad.position.set(px < 0 ? -0.015 : 0.015, 0.02, 0);

        upperArm.add(shoulderPad);



        // 팔꿈치 관절 피벗 (위팔 아래 끝단)

        const elbowPivot = new THREE.Group();

        elbowPivot.position.set(0, -0.25, 0);

        armGroup.add(elbowPivot);



        // 아래팔 (Forearm)

        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.25, 0.10), mat);

        forearm.position.y = -0.125;

        forearm.castShadow = true;

        forearm.receiveShadow = true;

        elbowPivot.add(forearm);



        // 손 (Hand) 추가 - 손끝에 살색 손 메쉬 생성

        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), skinMat);

        hand.position.set(0, -0.27, 0);

        hand.castShadow = true;

        hand.receiveShadow = true;

        elbowPivot.add(hand);



        return {

          group: armGroup,

          elbow: elbowPivot

        };

      }



      // 어깨 관절 구체 (Shoulder Joint Spheres)를 추가하여 몸통과 팔 사이의 이격된 공간을 자연스럽게 보강

      const jointMat = new THREE.MeshStandardMaterial({ color: camoColorHex, roughness: 0.8 });

      const leftJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);

      leftJoint.position.set(-0.31, 1.25, 0);

      leftJoint.castShadow = true;

      group.add(leftJoint);



      const rightJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);

      rightJoint.position.set(0.31, 1.25, 0);

      rightJoint.castShadow = true;

      group.add(rightJoint);



      const leftArm = createArm(camoMat, -0.38, 1.25, 0);

      const rightArm = createArm(camoMat, 0.38, 1.25, 0);

      group.add(leftArm.group);

      group.add(rightArm.group);



      // 양다리 (허벅지 + 무릎관절 구조 - 총 길이 0.6으로 축소하여 비율 수정 및 지면 뚫림 방지)

      function createLeg(mat, bootMat, px, py, pz) {

        const legGroup = new THREE.Group();

        legGroup.position.set(px, py, pz);



        // 허벅지 (Thigh) - 골반 피벗 기준

        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), mat);

        thigh.position.y = -0.13;

        thigh.castShadow = true;

        thigh.receiveShadow = true;

        legGroup.add(thigh);



        // 무릎 관절 피벗 (허벅지 아래 끝단)

        const kneePivot = new THREE.Group();

        kneePivot.position.set(0, -0.26, 0);

        legGroup.add(kneePivot);



        // 종아리 (Shin/Calf)

        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.14), mat);

        shin.position.y = -0.13;

        shin.castShadow = true;

        shin.receiveShadow = true;

        kneePivot.add(shin);



        // 무릎 보호대 (Knee Pad) 추가

        const padMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });

        const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), padMat);

        kneePad.position.set(0, 0, -0.09);

        kneePivot.add(kneePad);



        // 전투화 (발등이 앞쪽을 향하며 뒤꿈치 부분이 다리 끝단과 딱 맞도록 Z 좌표를 -0.05m로 보정)

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.24), bootMat);

        boot.position.set(0, -0.30, -0.05);

        boot.castShadow = true;

        boot.receiveShadow = true;

        kneePivot.add(boot);



        return {

          group: legGroup,

          knee: kneePivot

        };

      }



      const leftLeg = createLeg(pantsMat, bootMat, -0.16, 0.6, 0);

      const rightLeg = createLeg(pantsMat, bootMat, 0.16, 0.6, 0);



      group.add(leftLeg.group);

      group.add(rightLeg.group);



      // 전술 배낭 (가방 아이템 장착 시 표시)

      const backpackGroup = new THREE.Group();

      backpackGroup.position.set(0, 0.95, 0.16);

      group.add(backpackGroup);



      const backpackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.15), camoMat);

      backpackMesh.castShadow = true;

      backpackGroup.add(backpackMesh);

      backpackGroup.visible = false;



      // 낙하산용 배낭 (수송기/낙하/낙하산 모드에서 표시)

      const parachuteBag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.18), new THREE.MeshStandardMaterial({color: 0x888888, roughness: 0.9}));

      parachuteBag.position.set(0, 0.95, 0.16);

      parachuteBag.castShadow = true;

      parachuteBag.visible = false;

      group.add(parachuteBag);



      // 총기 마운트 포인트 (오른쪽 아래팔 하단(손)에 위치)

      const weaponContainer = new THREE.Group();

      weaponContainer.position.set(0, -0.25, 0);

      rightArm.elbow.add(weaponContainer);



      // 헬멧 레벨별 비주얼 업데이트 함수

      function updateHelmetVisual(level) {

        if (!level) {

          helmet.visible = false;

          visor.visible = false;

        } else {

          helmet.visible = true;

          if (level.name.includes('1')) {

            helmet.material.color.setHex(0x4caf50); // Level 1: Green

            visor.visible = false;

          } else if (level.name.includes('2')) {

            helmet.material.color.setHex(0x009688); // Level 2: Teal

            visor.visible = false;

          } else if (level.name.includes('3')) {

            helmet.material.color.setHex(0x212121); // Level 3: Black

            visor.visible = true; // Show visor

          }

        }

      }



      // 가방 레벨별 비주얼 업데이트 함수

      function updateBagVisual(level) {

        if (!level) {

          backpackGroup.visible = false;

        } else {

          backpackGroup.visible = true;

          if (level.name.includes('1')) {

            backpackMesh.scale.set(0.8, 0.8, 0.8);

            backpackMesh.material.color.setHex(0x8d6e63); // Brown

          } else if (level.name.includes('2')) {

            backpackMesh.scale.set(1.0, 1.0, 1.0);

            backpackMesh.material.color.setHex(0x5d4037); // Dark Brown

          } else if (level.name.includes('3')) {

            backpackMesh.scale.set(1.2, 1.2, 1.2);

            backpackMesh.material.color.setHex(0x3e2723); // Very Dark Brown

          }

        }

      }



      return {

        group: group,

        body: body,

        leftArm: leftArm.group,

        leftElbow: leftArm.elbow,

        rightArm: rightArm.group,

        rightElbow: rightArm.elbow,

        leftLeg: leftLeg.group,

        rightLeg: rightLeg.group,

        leftThigh: leftLeg.group,

        leftKnee: leftLeg.knee,

        rightThigh: rightLeg.group,

        rightKnee: rightLeg.knee,

        weaponContainer: weaponContainer,

        headGroup: headGroup,

        parachuteBag: parachuteBag,

        backpackGroup: backpackGroup,

        updateHelmetVisual: updateHelmetVisual,

        updateBagVisual: updateBagVisual,

        leftJoint: leftJoint,

        rightJoint: rightJoint

      };

    }



    function updateSoldierJoints(soldier) {

      if (soldier.leftJoint && soldier.leftArm) {

        soldier.leftJoint.position.set(soldier.leftArm.position.x + 0.07, soldier.leftArm.position.y, soldier.leftArm.position.z);

      }

      if (soldier.rightJoint && soldier.rightArm) {

        soldier.rightJoint.position.set(soldier.rightArm.position.x - 0.07, soldier.rightArm.position.y, soldier.rightArm.position.z);

      }

    }



    function createWeaponMesh(weapon, scope) {

      const weaponGroup = new THREE.Group();

      

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });

      const plasticMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });

      const scopeMat = new THREE.MeshStandardMaterial({ color: 0x1e3f20, roughness: 0.5 });

      const lensMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });



      if (weapon.name === '맨주먹' || weapon.name === '주먹') {

        return null;

      }



      if (weapon.name === '권총') {

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), plasticMat);

        grip.position.set(0, -0.05, -0.01);

        grip.rotation.x = 0.2;

        weaponGroup.add(grip);

        

        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), metalMat);

        slide.position.set(0, 0, 0.03);

        weaponGroup.add(slide);



        // 가늠쇠 & 가늠자 (Iron Sights) - 높이 상향 (Doom-style 시야 확보)

        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.01), plasticMat);

        rearSight.position.set(0, 0.035, -0.04);

        weaponGroup.add(rearSight);

        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.055, 0.01), plasticMat);

        frontSight.position.set(0, 0.040, 0.1);

        weaponGroup.add(frontSight);

        

      } else {

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.22), woodMat);

        stock.position.set(0, -0.03, -0.1);

        weaponGroup.add(stock);



        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), metalMat);

        receiver.position.set(0, 0, 0.05);

        weaponGroup.add(receiver);



        if (weapon.name === '돌격소총') {

          const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), plasticMat);

          mag.position.set(0, -0.09, 0.08);

          mag.rotation.x = -0.2;

          weaponGroup.add(mag);

          

          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35), metalMat);

          barrel.rotation.x = Math.PI / 2;

          barrel.position.set(0, 0.015, 0.28);

          weaponGroup.add(barrel);



          // 가늠자 (Rear Sight) - ㄷ자 형태 시뮬레이션 (높이 조정)

          const rsL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.01), plasticMat);

          rsL.position.set(-0.015, 0.06, -0.02); weaponGroup.add(rsL);

          const rsR = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.01), plasticMat);

          rsR.position.set(0.015, 0.06, -0.02); weaponGroup.add(rsR);

          

          // 가늠쇠 (Front Sight)

          const fs = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.01), plasticMat);

          fs.position.set(0, 0.055, 0.4); weaponGroup.add(fs);

          

        } else if (weapon.name === '저격총') {

          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55), metalMat);

          barrel.rotation.x = Math.PI / 2;

          barrel.position.set(0, 0.015, 0.38);

          weaponGroup.add(barrel);

          

          const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), plasticMat);

          tip.rotation.x = Math.PI / 2;

          tip.position.set(0, 0.015, 0.68);

          weaponGroup.add(tip);



          // 저격총 기본 가늠쇠/가늠자 (높이 상향)

          const rs = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.02), metalMat);

          rs.position.set(0, 0.055, -0.02); weaponGroup.add(rs);

          const fs = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.01), metalMat);

          fs.position.set(0, 0.05, 0.6); weaponGroup.add(fs);

          

        } else if (weapon.name === '샷건') {

          const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3), metalMat);

          barrel1.rotation.x = Math.PI / 2;

          barrel1.position.set(-0.012, 0.015, 0.25);

          weaponGroup.add(barrel1);

          

          const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3), metalMat);

          barrel2.rotation.x = Math.PI / 2;

          barrel2.position.set(0.012, 0.015, 0.25);

          weaponGroup.add(barrel2);



          // 샷건 앞쪽 돌기 (Bead) - 높이 상향

          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.04), woodMat);

          bead.position.set(0, 0.055, 0.38);

          weaponGroup.add(bead);

        }

      }



      if (scope && scope.name !== '기계식 조준기' && scope.name !== '없음') {

        // 스코프가 총기에 파묻히지 않도록 높이를 Y=0.09로 상향 조절

        const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12), scopeMat);

        scopeBody.rotation.x = Math.PI / 2;

        scopeBody.position.set(0, 0.09, 0.05);

        weaponGroup.add(scopeBody);



        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01), lensMat);

        lens.rotation.x = Math.PI / 2;

        lens.position.set(0, 0.09, 0.11);

        weaponGroup.add(lens);



        // 스코프와 총기 몸통(Y=0.04)을 견고하게 연결해 줄 마운트(Mount) 블록 2개 추가

        const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.025), scopeMat);

        mount1.position.set(0, 0.0575, 0.01);

        weaponGroup.add(mount1);



        const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.025), scopeMat);

        mount2.position.set(0, 0.0575, 0.09);

        weaponGroup.add(mount2);

      }



      weaponGroup.rotation.x = Math.PI / 2;

      weaponGroup.rotation.z = Math.PI; // 총기를 180도 회전시켜 탄창이 아래를 향하고 가늠자/조준경이 위를 향하도록 올바르게 장착

      

      // 권총과 소총류의 손잡이 위치가 캐릭터 손(Y = -0.27)에 오도록 Y 및 Z 오프셋 동적 보정

      if (weapon.name === '권총') {

        weaponGroup.position.set(0, -0.03, 0.03);

      } else {

        weaponGroup.position.set(0, -0.11, 0.03);

      }

      return weaponGroup;

    }



    function updateVisualEquip(soldierParts, weapon, scope) {

      while (soldierParts.weaponContainer.children.length > 0) {

        soldierParts.weaponContainer.remove(soldierParts.weaponContainer.children[0]);

      }

      const weaponMesh = createWeaponMesh(weapon, scope);

      if (weaponMesh) {

        weaponMesh.userData = { weaponName: weapon.name };

        soldierParts.weaponContainer.add(weaponMesh);

      }

    }



    // Global muzzle flash resources to prevent GPU memory leaks

    const muzzleFlashConeGeo = new THREE.ConeGeometry(0.15, 0.4, 6);

    const muzzleFlashSphereGeo = new THREE.SphereGeometry(0.22);

    const muzzleFlashConeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.95 });

    const muzzleFlashSphereMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5 });



    // 머즐 플래시 연출

    function triggerMuzzleFlash(weaponContainer) {

      if (!weaponContainer || weaponContainer.children.length === 0) return;

      const weaponMesh = weaponContainer.children[0];

      if (!weaponMesh) return;

      const weaponName = (weaponMesh.userData && weaponMesh.userData.weaponName) || '권총';

      

      let flashZ = 0.46;

      let flashY = 0.015;

      if (weaponName === '권총') {

        flashZ = 0.12;

        flashY = 0.02;

      } else if (weaponName === '돌격소총') {

        flashZ = 0.46;

        flashY = 0.015;

      } else if (weaponName === '저격총') {

        flashZ = 0.72;

        flashY = 0.015;

      } else if (weaponName === '샷건') {

        flashZ = 0.40;

        flashY = 0.015;

      }

      

      const flash = new THREE.Mesh(muzzleFlashConeGeo, muzzleFlashConeMat);

      flash.rotation.x = Math.PI / 2;

      flash.position.set(0, flashY, flashZ);

      weaponMesh.add(flash);

      

      const glow = new THREE.Mesh(muzzleFlashSphereGeo, muzzleFlashSphereMat);

      glow.position.set(0, flashY, flashZ);

      weaponMesh.add(glow);

      

      setTimeout(() => {

        if (weaponMesh && typeof weaponMesh.remove === 'function') {

          try {

            weaponMesh.remove(flash);

            weaponMesh.remove(glow);

          } catch(e) {}

        }

      }, 60);

    }



    // --- [엄폐물 충돌 엔진] ---

    function resolveCollisions(pos, playerRadius = 0.45, excludeId = null, outNormal = null) {

      if (isVaulting) return false; // 창문 넘는 도중에는 충돌 무시



      let collided = false;

      let totalPushX = 0;

      let totalPushZ = 0;



      obstacles.forEach(obs => {

        if (obs.type === 'TREE' || obs.type === 'ROCK') {

          const dx = pos.x - obs.x;

          const dz = pos.z - obs.z;

          const dist = Math.sqrt(dx * dx + dz * dz);

          const minDist = obs.radius + playerRadius;

          if (dist < minDist) {

            collided = true;

            if (dist === 0) {

              const angle = Math.random() * Math.PI * 2;

              const px = Math.cos(angle) * minDist;

              const pz = Math.sin(angle) * minDist;

              pos.x += px;

              pos.z += pz;

              totalPushX += px;

              totalPushZ += pz;

            } else {

              const pushX = (dx / dist) * (minDist - dist);

              const pushZ = (dz / dist) * (minDist - dist);

              pos.x += pushX;

              pos.z += pushZ;

              totalPushX += dx / dist;

              totalPushZ += dz / dist;

            }

          }

        } else if (obs.type === 'BUILDING') {

          const hw = obs.w / 2;

          const hd = obs.d / 2;

          const rampW = 1.5;



          // 플레이어가 램프 스페이스(서측)에 있는지 감지 (충돌 마진 포함, 벽 침투 방지를 위해 건물 벽 경계 동측 마진 +0.2를 0.0으로 제한)

          const isOnRamp = (pos.x >= obs.spotX - hw - rampW - 0.4 && pos.x <= obs.spotX - hw &&

                            pos.z >= obs.spotZ - hd - 0.4 && pos.z <= obs.spotZ + hd + 0.4);



          // 옥상 높이(spotY + 3.8 이상) 또는 램프 진입 상승 중(spotY + 0.3 이상)에는 벽 충돌을 면제하여 옥상 진입 걸림 방지

          if (pos.y > obs.spotY + 3.8 || (isOnRamp && pos.y > obs.spotY + 0.3)) {

            return;

          }



          obs.walls.forEach(w => {

            const cx = Math.max(w.minX, Math.min(pos.x, w.maxX));

            const cz = Math.max(w.minZ, Math.min(pos.z, w.maxZ));

            

            const dx = pos.x - cx;

            const dz = pos.z - cz;

            const dist = Math.sqrt(dx * dx + dz * dz);

            

            if (dist < playerRadius) {

              collided = true;

              if (dist === 0) {

                pos.x = w.maxX + playerRadius;

                totalPushX += 1;

              } else {

                const pushX = (dx / dist) * (playerRadius - dist);

                const pushZ = (dz / dist) * (playerRadius - dist);

                pos.x += pushX;

                pos.z += pushZ;

                totalPushX += dx / dist;

                totalPushZ += dz / dist;

              }

            }

          });

        }

      });



      // 닫힌 문과의 동적 충돌 검사

      doorsList.forEach(door => {

        if (!door.isOpen) {

          const groundY = getElevation(door.x, door.z, false);

          // 문 높이보다 플레이어가 높이 있으면 충돌 무시

          if (pos.y > groundY + 3.2) return;



          const minX = door.x - door.w/2;

          const maxX = door.x + door.w/2;

          const minZ = door.z - door.d/2;

          const maxZ = door.z + door.d/2;



          const cx = Math.max(minX, Math.min(pos.x, maxX));

          const cz = Math.max(minZ, Math.min(pos.z, maxZ));

          

          const dx = pos.x - cx;

          const dz = pos.z - cz;

          const dist = Math.sqrt(dx * dx + dz * dz);

          

          if (dist < playerRadius) {

            collided = true;

            if (dist === 0) {

              pos.x += playerRadius;

              totalPushX += 1;

            } else {

              const pushX = (dx / dist) * (playerRadius - dist);

              const pushZ = (dz / dist) * (playerRadius - dist);

              pos.x += pushX;

              pos.z += pushZ;

              totalPushX += dx / dist;

              totalPushZ += dz / dist;

            }

          }

        }

      });



      // 1. 플레이어와 적 캐릭터 밀어내기 (AI 캐릭터일 때만 상호 충돌 해결)

      if (excludeId && excludeId !== 'PLAYER' && playerHp > 0) {

        const dx = pos.x - playerPos.x;

        const dz = pos.z - playerPos.z;

        const dist = Math.sqrt(dx * dx + dz * dz);

        const minDist = 0.75;

        if (dist < minDist) {

          collided = true;

          const push = (minDist - dist) * 0.5;

          if (dist > 0.01) {

            pos.x += (dx / dist) * push;

            pos.z += (dz / dist) * push;

            totalPushX += dx / dist;

            totalPushZ += dz / dist;

          } else {

            pos.x += minDist * 0.5;

            totalPushX += 1;

          }

        }

      }



      // 2. 다른 활성 적 AI 캐릭터들과의 상호 중첩 방지 (상호 척력 적용)

      if (typeof enemies !== 'undefined') {

        enemies.forEach(other => {

          if (other.id !== excludeId && other.hp > 0 && other.state === 'PLAYING') {

            const dx = pos.x - other.mesh.position.x;

            const dz = pos.z - other.mesh.position.z;

            const dist = Math.sqrt(dx * dx + dz * dz);

            const minDist = 0.85; // 겹침 방지 임계 거리

            if (dist < minDist) {

              collided = true;

              const push = (minDist - dist) * 0.5;

              if (dist > 0.01) {

                pos.x += (dx / dist) * push;

                pos.z += (dz / dist) * push;

                other.mesh.position.x -= (dx / dist) * push;

                other.mesh.position.z -= (dz / dist) * push;

                totalPushX += dx / dist;

                totalPushZ += dz / dist;

              } else {

                pos.x += minDist * 0.5;

                totalPushX += 1;

              }

            }

          }

        });

      }



      if (outNormal && collided) {

        const len = Math.sqrt(totalPushX * totalPushX + totalPushZ * totalPushZ);

        if (len > 0.001) {

          outNormal.x = totalPushX / len;

          outNormal.z = totalPushZ / len;

        } else {

          outNormal.x = 0;

          outNormal.z = -1;

        }

      }



      return collided;

    }



    // --- [2. 수송기 및 플레이어 시스템] ---

    let gameState = 'LOBBY'; 

    

    // 로비 인터랙티브 카메라 변수

    let lobbyAngle = 0;

    let lobbyPitch = 0.15;

    let lobbyDistance = 3.2;

    let isLobbyDragging = false;

    let prevLobbyMouseX = 0;

    let prevLobbyMouseY = 0;

    

    // 플레이어 점프, 자세 및 창문 넘기 관련 상태 변수

    let playerVelocityY = 0;

    let isGrounded = true;

    let playerStance = 'STAND'; // 'STAND', 'CROUCH', 'PRONE'

    let currentEyeY = 1.5;

    let currentTppY = 1.6;

    

    let isVaulting = false;

    let vaultStartTime = 0;

    let ironSightWeight = 0;

    const VAULT_DURATION = 0.5; // 0.5초 동안 진행

    const vaultStartPos = new THREE.Vector3();

    const vaultEndPos = new THREE.Vector3();

    

    const planeGroup = new THREE.Group();

    

    // --- [로비 사운드 및 초기화 이벤트] ---

    const startBGMHandler = () => {

      if (gameState === 'LOBBY') {

        initAudio();

        if (bgmEnabled) {

          SoundSystem.playBGM();

        }

        // 브라우저 전체화면 요청 및 모바일 가로 방향 고정

        const docEl = document.documentElement;

        const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;

        if (requestFs) {

          requestFs.call(docEl).then(() => {

            if (screen.orientation && screen.orientation.lock) {

              screen.orientation.lock('landscape').catch(err => {});

            }

          }).catch(err => {});

        } else {

          if (screen.orientation && screen.orientation.lock) {

            screen.orientation.lock('landscape').catch(err => {});

          }

        }

      }

      document.removeEventListener('click', startBGMHandler);

      document.removeEventListener('touchstart', startBGMHandler);

    };

    document.addEventListener('click', startBGMHandler);

    document.addEventListener('touchstart', startBGMHandler);

    

    // --- [BGM & SFX 설정 제어 변수 및 이벤트 바인딩] ---

    const bgmBtn = document.getElementById('btn-toggle-bgm');

    const sfxBtn = document.getElementById('btn-toggle-sfx');



    bgmBtn.addEventListener('click', (e) => {

      e.stopPropagation();

      initAudio();

      bgmEnabled = !bgmEnabled;

      if (bgmEnabled) {

        bgmBtn.innerText = '🎵 BGM: ON';

        bgmBtn.style.color = '#00ffcc';

        SoundSystem.playBGM();

      } else {

        bgmBtn.innerText = '🎵 BGM: OFF';

        bgmBtn.style.color = '#ffb300';

        SoundSystem.stopBGM();

      }

    });



    sfxBtn.addEventListener('click', (e) => {

      e.stopPropagation();

      initAudio();

      sfxEnabled = !sfxEnabled;

      if (sfxEnabled) {

        sfxBtn.innerText = '🔊 SFX: ON';

        sfxBtn.style.color = '#00ffcc';

      } else {

        sfxBtn.innerText = '🔊 SFX: OFF';

        sfxBtn.style.color = '#ffb300';

      }

    });

    

    // --- [수송기 모델의 세밀한 모델링 구현] ---

    const planeMat = new THREE.MeshStandardMaterial({color: 0x2d3a2d, roughness: 0.5, metalness: 0.2}); // 국방색 주 동체

    const darkPlaneMat = new THREE.MeshStandardMaterial({color: 0x1e271e, roughness: 0.6, metalness: 0.2}); // 날개 밑 등 더 어두운 부분

    

    // 메인 동체 (Fuselage)

    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 42, 16), planeMat);

    pBody.rotation.x = Math.PI / 2;

    pBody.position.set(0, 0, 0);



    // 노즈 콘 (Nose Cone) - 둥근 돔 형태로 변경

    const pNose = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), planeMat);

    pNose.rotation.x = Math.PI / 2;

    pNose.position.set(0, -0.2, 21);



    // 앞부분 노즈 대형 프로펠러 (Nose Propeller)

    const nosePropellerGroup = new THREE.Group();

    nosePropellerGroup.position.set(0, -0.2, 21 + 4.5);



    const noseSpinner = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.0, 8), new THREE.MeshStandardMaterial({color: 0x333333, metalness: 0.9}));

    noseSpinner.rotation.x = Math.PI / 2;

    nosePropellerGroup.add(noseSpinner);



    for (let b = 0; b < 4; b++) {

      const blade = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.4, 0.12), new THREE.MeshStandardMaterial({color: 0x111111}));

      blade.rotation.z = (b * Math.PI) / 2;

      nosePropellerGroup.add(blade);

    }



    // 조종석 창문 (Cockpit window)

    const pWindow = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 2), new THREE.MeshStandardMaterial({color: 0x05080b, roughness: 0.1, metalness: 0.9}));

    pWindow.position.set(0, 2.3, 19.5);



    // 날개 조립 (Main Wings with dihedral angle and sweepback)

    const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 8), planeMat);

    wingLeft.position.set(-13.5, 1.5, 2);

    wingLeft.rotation.y = -0.06; // sweepback

    wingLeft.rotation.z = 0.03;  // dihedral

    

    const wingRight = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 8), planeMat);

    wingRight.position.set(13.5, 1.5, 2);

    wingRight.rotation.y = 0.06;

    wingRight.rotation.z = -0.03;



    // 윙렛 (Wingtip winglets)

    const wingletLeft = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 4), darkPlaneMat);

    wingletLeft.position.set(-25.2, 2.0, 1.3);

    wingletLeft.rotation.z = 0.6; // 위로 꺾임



    const wingletRight = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 4), darkPlaneMat);

    wingletRight.position.set(25.2, 2.0, 1.3);

    wingletRight.rotation.z = -0.6;



    // 수직 꼬리 날개 (Vertical Stabilizer)

    const pTailVert = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 8), planeMat);

    pTailVert.position.set(0, 7.5, -18);

    

    // 수평 꼬리 날개 (Horizontal Stabilizers)

    const pTailHoriz = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 6), darkPlaneMat);

    pTailHoriz.position.set(0, 2, -18);



    // 후방 카고 램프 도어 (Cargo Door Ramp)

    const cargoRamp = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 8), darkPlaneMat);

    cargoRamp.position.set(0, -1.8, -17);

    cargoRamp.rotation.x = -0.08;



    // 랜딩기어 돌출부 포드 (Landing Gear Pods)

    const gearPodLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 12), darkPlaneMat);

    gearPodLeft.position.set(-4.5, -2.5, 0);

    const gearPodRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 12), darkPlaneMat);

    gearPodRight.position.set(4.5, -2.5, 0);



    planeGroup.add(pBody, pNose, pWindow, wingLeft, wingRight, wingletLeft, wingletRight, pTailVert, pTailHoriz, cargoRamp, gearPodLeft, gearPodRight, nosePropellerGroup);

    planePropellers.push(nosePropellerGroup);



    // 4개의 프로펠러 터보프롭 엔진 (Engines & Propellers)

    const engineGeo = new THREE.CylinderGeometry(1.5, 1.3, 7, 8);

    const engineMat = new THREE.MeshStandardMaterial({color: 0x1f221f, metalness: 0.8, roughness: 0.3});

    

    const enginePositions = [

      { x: -7.5, y: -0.2, z: 2.3 },

      { x: -16.5, y: -0.2, z: 2.3 },

      { x: 7.5, y: -0.2, z: 2.3 },

      { x: 16.5, y: -0.2, z: 2.3 }

    ];



    enginePositions.forEach((pos, idx) => {

      // 엔진 카울링

      const eng = new THREE.Mesh(engineGeo, engineMat);

      eng.rotation.x = Math.PI / 2;

      eng.position.set(pos.x, pos.y, pos.z);

      planeGroup.add(eng);



      // 제트 가스 배기구 오렌지 글로우 효과 (Engine exhaust)

      const glowGeo = new THREE.ConeGeometry(0.7, 1.8, 8);

      const glowMat = new THREE.MeshBasicMaterial({color: 0xff3300});

      const glow = new THREE.Mesh(glowGeo, glowMat);

      glow.rotation.x = -Math.PI / 2;

      glow.position.set(pos.x, pos.y, pos.z - 4);

      planeGroup.add(glow);



      // 스피너 프로펠러 회전 부품 생성

      const propellerGroup = new THREE.Group();

      propellerGroup.position.set(pos.x, pos.y, pos.z + 3.8);



      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 8), new THREE.MeshStandardMaterial({color: 0x333333, metalness: 0.9}));

      spinner.rotation.x = Math.PI / 2;

      propellerGroup.add(spinner);



      // 4엽 블레이드

      for (let b = 0; b < 4; b++) {

        const blade = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.08), new THREE.MeshStandardMaterial({color: 0x111111}));

        blade.rotation.z = (b * Math.PI) / 2;

        propellerGroup.add(blade);

      }



      planeGroup.add(propellerGroup);

      planePropellers.push(propellerGroup);

    });



    // 항법 표시등 (Navigation Lights)

    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({color: 0xff0000}));

    redLight.position.set(-26.5, 2.5, 1.3);

    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({color: 0x00ff00}));

    greenLight.position.set(26.5, 2.5, 1.3);

    const tailLight = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({color: 0xffffff}));

    tailLight.position.set(0, 13.5, -21);



    planeGroup.add(redLight, greenLight, tailLight);

    planeNavLights.push(redLight, greenLight, tailLight);



    planeGroup.position.set(-300, 280, -300); planeGroup.lookAt(300, 280, 300); scene.add(planeGroup);



    // 낙하산 비닐 + 8개의 연결선(끈)을 포함하는 그룹 생성

    const parachute = new THREE.Group();

    const parachuteGeo = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    const canopyMesh = new THREE.Mesh(parachuteGeo, new THREE.MeshStandardMaterial({color: 0xdddddd, side: THREE.DoubleSide, transparent: true, opacity: 0.85}));

    parachute.add(canopyMesh);



    // 낙하산 비닐 끝단과 캐릭터 배낭 위치를 이어줄 8개의 라인 생성

    const linesMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });

    const numStrings = 8;

    for (let i = 0; i < numStrings; i++) {

      const angle = (i / numStrings) * Math.PI * 2;

      const rimX = Math.cos(angle) * 3;

      const rimZ = Math.sin(angle) * 3;

      

      const points = [

        new THREE.Vector3(rimX, 0, rimZ),

        new THREE.Vector3(0, -4.55, -0.16) // 배낭 연결부 (y = -4.55 relative to canopy at 5.5, z = -0.16)

      ];

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(lineGeo, linesMaterial);

      parachute.add(line);

    }

    parachute.visible = false; 



    let isTPP = true; 

    const playerPos = new THREE.Vector3(0, 1.8, 0); // 로비 중앙 위치

    const playerSoldier = createSoldierModel(0x3d5c3d, 0xffccaa);

    const myPlayerGroup = playerSoldier.group;

    scene.add(myPlayerGroup); myPlayerGroup.visible = true; // 로비 3D 화면을 위해 보이도록 설정

    parachute.position.set(0, 5.5, 0);

    myPlayerGroup.add(parachute);



    const actionBtn = document.getElementById('action-btn');

    const noticeBox = document.getElementById('notice-box');

    function showNotice(msg, time = 2500) { noticeBox.innerText = msg; noticeBox.style.display = 'block'; setTimeout(() => { noticeBox.style.display = 'none'; }, time); }



    function togglePerspective() {

      isTPP = !isTPP;

      if (isTouchDevice) document.getElementById('btn-tpp').innerText = isTPP ? '1인칭' : '3인칭';

      showNotice(isTPP ? "3인칭 (TPP)" : "1인칭 (FPP)", 1500);

    }

    actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleActionBtn(); }, {passive:false});

    actionBtn.addEventListener('click', () => { handleActionBtn(); });

    function handleActionBtn() {

      if(gameState === 'AIRPLANE') { 

        gameState = 'FALLING'; 

        actionBtn.innerText = isTouchDevice ? '🪂 낙하산 펴기' : '🪂 낙하산 펴기 (좌클릭/F)'; 

        SoundSystem.stopPlaneSound();

        SoundSystem.playSkydiveWindSound();

      } 

      else if (gameState === 'FALLING') { 

        gameState = 'PARACHUTING'; 

        parachute.visible = true; 

        actionBtn.style.display = 'none'; 

        SoundSystem.playParachuteSound(); 

      }

    }



    // --- [3. 아이템, 무기 및 스코프 시스템] ---

    let playerHp = 100; let killCount = 0; let totalAlive = 50;

    

    // 무기 및 설정 (상단으로 이동됨)



    let currentWeapon = WEAPONS.RIFLE; // 로비에서 총기를 들고 있도록 설정

    let currentScope = SCOPES.X2;

    playerInventory.weapon = WEAPONS.RIFLE;

    playerInventory.scope = SCOPES.X2;

    updateVisualEquip(playerSoldier, currentWeapon, currentScope);



    let isHealing = false;

    let healTimer = 0;

    const HEAL_DURATION = 6.0;



    function startHealing() {

      if (gameState !== 'PLAYING' || playerHp <= 0) return;

      if (playerInventory.firstaids <= 0) {

        showNotice("구급상자가 없습니다!");

        return;

      }

      if (playerHp >= 75) {

        showNotice("체력이 이미 75% 이상입니다!");

        return;

      }

      if (isHealing) return;



      isHealing = true;

      healTimer = 0;

      

      if (isInventoryOpen) {

        toggleInventory();

      }

      

      document.getElementById('heal-progress-container').style.display = 'block';

      showNotice("구급상자를 사용하는 중... (움직이면 취소됩니다)");

    }



    function updateSkydivePose(soldier, fwd, rgt, isParachuting) {

      let lArmX, lArmY, lArmZ;

      let rArmX, rArmY, rArmZ;



      if (isParachuting) {

        // 만세 자세 (낙하산 조종끈 잡기)

        lArmX = Math.PI - 0.3; lArmY = 0.2; lArmZ = -0.15;

        rArmX = Math.PI + 0.3; rArmY = -0.2; rArmZ = 0.15;



        // 좌우 조작에 따른 팔의 피드백 연출

        if (rgt < -0.2) {

          // 좌회전: 왼손을 당김

          lArmX = Math.PI / 2 + 0.2; lArmY = 0.6; lArmZ = -0.5;

        } else if (rgt > 0.2) {

          // 우회전: 오른손을 당김

          rArmX = Math.PI / 2 - 0.2; rArmY = -0.6; rArmZ = 0.5;

        }

      } else {

        // 대자로 엎드려 낙하하는 자세 (스카이다이빙 바람 타고 하강)

        const flutter = Math.sin(clock.getElapsedTime() * 26.0) * 0.08;

        lArmX = 1.9 - flutter; lArmY = 0.3; lArmZ = -0.2;

        rArmX = 1.9 - flutter; rArmY = -0.3; rArmZ = 0.2;



        if (rgt < -0.2) {

          lArmX = 0.8 - flutter; lArmY = 0.4;

        } else if (rgt > 0.2) {

          rArmX = 0.8 - flutter; rArmY = -0.4;

        } else if (fwd > 0.2) {

          lArmX = 2.3 - flutter; lArmY = 0.1;

          rArmX = 2.3 - flutter; rArmY = -0.1;

        } else if (fwd < -0.2) {

          lArmX = 0.6 - flutter; lArmY = 0.3;

          rArmX = 0.6 - flutter; rArmY = -0.3;

        }

        

        // 다리도 바람에 펄럭임

        soldier.leftThigh.rotation.set(0.3 + flutter * 0.5, 0, 0);

        soldier.rightThigh.rotation.set(0.3 - flutter * 0.5, 0, 0);

        soldier.leftKnee.rotation.set(0.6 + flutter, 0, 0);

        soldier.rightKnee.rotation.set(0.6 - flutter, 0, 0);

      }



      soldier.leftArm.rotation.set(lArmX, lArmY, lArmZ);

      soldier.rightArm.rotation.set(rArmX, rArmY, rArmZ);



      soldier.body.position.y = 0.95;

      soldier.headGroup.position.y = 1.45;

      soldier.leftArm.position.y = 1.25;

      soldier.rightArm.position.y = 1.25;

    }



    // 문 상호작용

    function tryInteractDoor() {

      if (gameState !== 'PLAYING' || playerHp <= 0) return false;

      

      let closestDoor = null;

      let minDist = 2.5; // 최대 2.5m 거리

      

      doorsList.forEach(door => {

        const dist = playerPos.distanceTo(door.worldPos);

        if (dist < minDist) {

          closestDoor = door;

          minDist = dist;

        }

      });

      

      if (closestDoor) {

        closestDoor.isOpen = !closestDoor.isOpen;

        if (closestDoor.isOpen) {

          // 90도 회전하여 문을 엶

          closestDoor.pivot.rotation.y = Math.PI / 2;

          showNotice("🚪 문을 열었습니다.");

        } else {

          // 0도로 돌려 문을 닫음

          closestDoor.pivot.rotation.y = 0;

          showNotice("🚪 문을 닫았습니다.");

        }

        return true;

      }

      return false;

    }



    // 창문 넘기 (파쿠르)

    function tryVaultWindow() {

      if (isVaulting || gameState !== 'PLAYING' || playerHp <= 0) return false;

      

      let closestWindow = null;

      let minDist = 2.0; // 최대 2m 거리

      

      windowSpots.forEach(w => {

        const dist = playerPos.distanceTo(new THREE.Vector3(w.x, playerPos.y, w.z));

        if (dist < minDist) {

          closestWindow = w;

          minDist = dist;

        }

      });

      

      if (closestWindow) {

        isVaulting = true;

        vaultStartTime = clock.getElapsedTime();

        vaultStartPos.copy(playerPos);

        

        // 창문 방향 벡터

        const windowVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), closestWindow.angle);

        // 플레이어가 창문 기준 어느 쪽에 있는지 판단하여 반대편 1.6m 위치로 이동 목표 설정

        const toPlayer = new THREE.Vector3().subVectors(playerPos, new THREE.Vector3(closestWindow.x, playerPos.y, closestWindow.z));

        const dot = toPlayer.dot(windowVec);

        

        const directionFactor = dot > 0 ? -1.6 : 1.6;

        vaultEndPos.copy(new THREE.Vector3(closestWindow.x, closestWindow.y - 1.3, closestWindow.z)).addScaledVector(windowVec, directionFactor);

        

        // 목표지의 높이 지면 정합 (창문 밑 지면 또는 건물 바닥으로 정합하기 위해 높이 힌트 전달)

        vaultEndPos.y = getElevation(vaultEndPos.x, vaultEndPos.z, closestWindow.y - 1.3);

        

        showNotice("🪟 창문 넘기!");

        return true;

      }

      return false;

    }



    let isInventoryOpen = false;



    function updateInventoryUI() {

      // 1. 장비 목록 업데이트

      document.getElementById('inv-weapon-val').innerText = playerInventory.weapon.name;

      document.getElementById('inv-weapon-drop-btn').style.display = (playerInventory.weapon !== WEAPONS.PUNCH) ? 'inline-block' : 'none';



      document.getElementById('inv-scope-val').innerText = playerInventory.scope.name;

      document.getElementById('inv-scope-drop-btn').style.display = (playerInventory.scope !== SCOPES.NONE) ? 'inline-block' : 'none';



      document.getElementById('inv-helmet-val').innerText = playerInventory.helmet ? playerInventory.helmet.name : '없음';

      document.getElementById('inv-helmet-drop-btn').style.display = playerInventory.helmet ? 'inline-block' : 'none';



      document.getElementById('inv-bag-val').innerText = playerInventory.bag ? playerInventory.bag.name : '없음';

      document.getElementById('inv-bag-drop-btn').style.display = playerInventory.bag ? 'inline-block' : 'none';



      // 2. 투척류 수량 및 숏컷 텍스트 업데이트

      document.getElementById('inv-firstaid-count').innerText = playerInventory.firstaids;

      document.getElementById('inv-grenade-count').innerText = playerInventory.grenades;

      document.getElementById('inv-smoke-count').innerText = playerInventory.smokes;

      

      document.getElementById('inv-ammo-pistol').innerText = playerInventory.ammo.PISTOL;

      document.getElementById('inv-ammo-shotgun').innerText = playerInventory.ammo.SHOTGUN;

      document.getElementById('inv-ammo-rifle').innerText = playerInventory.ammo.RIFLE;

      document.getElementById('inv-ammo-sniper').innerText = playerInventory.ammo.SNIPER;



      // 모바일 전용 힐링 버튼 표시 여부 업데이트

      if (isTouchDevice) {

        document.getElementById('btn-heal').style.display = (playerInventory.firstaids > 0) ? 'flex' : 'none';

        document.getElementById('btn-inventory').style.display = 'flex';

      }



      document.getElementById('btn-throw-grenade').innerText = `G: 수류탄 던지기 (${playerInventory.grenades})`;

      document.getElementById('btn-throw-smoke').innerText = `H: 연막탄 던지기 (${playerInventory.smokes})`;



      // 3. 주변 파밍 리스트 렌더링

      const lootList = document.getElementById('ground-loot-list');

      lootList.innerHTML = '';

      

      let nearbyCount = 0;

      lootBoxes.forEach((loot, index) => {

        const dist = playerPos.distanceTo(loot.mesh.position);

        if (dist < 3.5) {

          if (loot.isCrate) {

            let hasItems = false;

            const addCrateItemRow = (itemName, subType) => {

              hasItems = true;

              nearbyCount++;

              const row = document.createElement('div');

              row.className = 'loot-item-row';

              row.innerHTML = `

                <span class="loot-item-name">${itemName} [시체]</span>

                <button class="loot-btn" ontouchstart="window.pickupItem(${index}, '${subType}'); event.stopPropagation();" onclick="window.pickupItem(${index}, '${subType}'); event.stopPropagation();">줍기</button>

              `;

              lootList.appendChild(row);

            };



            if (loot.weapon) {

              addCrateItemRow(loot.weapon.name, 'weapon');

            }

            if (loot.scope && loot.scope !== SCOPES.NONE) {

              addCrateItemRow(loot.scope.name, 'scope');

            }

            if (loot.helmet) {

              addCrateItemRow(loot.helmet.name, 'helmet');

            }

            if (loot.bag) {

              addCrateItemRow(loot.bag.name, 'bag');

            }

            if (loot.firstaids && loot.firstaids > 0) {

              addCrateItemRow(`구급상자 ${loot.firstaids}개`, 'firstaid');

            }

            if (loot.grenades && loot.grenades > 0) {

              addCrateItemRow(`수류탄 ${loot.grenades}개`, 'grenade');

            }

            if (loot.smokes && loot.smokes > 0) {

              addCrateItemRow(`연막탄 ${loot.smokes}개`, 'smoke');

            }

            if (loot.ammoCount && loot.ammoCount > 0 && loot.ammoType) {

              addCrateItemRow(`${getAmmoName(loot.ammoType)} ${loot.ammoCount}발`, 'ammo');

            }



            if (!hasItems) {

              nearbyCount++;

              const row = document.createElement('div');

              row.className = 'loot-item-row';

              row.innerHTML = `

                <span class="loot-item-name">비어있는 시체 상자 [시체]</span>

                <button class="loot-btn" disabled style="opacity: 0.5;">줍기</button>

              `;

              lootList.appendChild(row);

            }

          } else {

            nearbyCount++;

            const row = document.createElement('div');

            row.className = 'loot-item-row';

            const name = loot.val.name || loot.type;

            row.innerHTML = `

              <span class="loot-item-name">${name}</span>

              <button class="loot-btn" ontouchstart="window.pickupItem(${index}); event.stopPropagation();" onclick="window.pickupItem(${index}); event.stopPropagation();">줍기</button>

            `;

            lootList.appendChild(row);

          }

        }

      });



      if (nearbyCount === 0) {

        lootList.innerHTML = `<div style="color:#888; text-align:center; margin-top:20px; font-size:12px;">주변에 아이템이 없습니다.</div>`;

        document.getElementById('loot-prompt').style.display = 'none';

      } else {

        if (!isInventoryOpen && gameState === 'PLAYING') {

          document.getElementById('loot-prompt').style.display = 'block';

        } else {

          document.getElementById('loot-prompt').style.display = 'none';

        }

      }

    }



    function toggleInventory() {

      if (gameState !== 'PLAYING' || playerHp <= 0) return;

      isInventoryOpen = !isInventoryOpen;

      const invUI = document.getElementById('inventory-ui');

      if (isInventoryOpen) {

        invUI.style.display = 'flex';

        document.exitPointerLock();

        updateInventoryUI();

      } else {

        invUI.style.display = 'none';

        try { document.body.requestPointerLock(); } catch(e) {}

      }

    }



    window.pickupItem = function(index, subType = null) {

      if (index < 0 || index >= lootBoxes.length) return;

      const loot = lootBoxes[index];

      

      const currentItemsCount = playerInventory.grenades + playerInventory.smokes + playerInventory.firstaids;

      const maxCapacity = playerInventory.bag ? playerInventory.bag.capacity : 2;



      if (loot.isCrate) {

        let pickedAnything = false;

        

        let targetType = subType;

        if (!targetType) {

          if (loot.ammoCount && loot.ammoCount > 0) targetType = 'ammo';

          else if (loot.firstaids && loot.firstaids > 0) targetType = 'firstaid';

          else if (loot.grenades && loot.grenades > 0) targetType = 'grenade';

          else if (loot.smokes && loot.smokes > 0) targetType = 'smoke';

          else if (loot.weapon) targetType = 'weapon';

          else if (loot.scope && loot.scope !== SCOPES.NONE) targetType = 'scope';

          else if (loot.helmet) targetType = 'helmet';

          else if (loot.bag) targetType = 'bag';

        }



        if (targetType === 'weapon' && loot.weapon) {

          const oldWeapon = playerInventory.weapon;

          playerInventory.weapon = loot.weapon;

          currentWeapon = loot.weapon;

          loot.weapon = null;

          pickedAnything = true;

          showNotice(`시체상자에서 [${currentWeapon.name}] 획득!`);

          if (oldWeapon !== WEAPONS.PUNCH) {

            spawnGroundItem(playerPos.clone(), 'WEAPON', oldWeapon);

          }

        }

        else if (targetType === 'scope' && loot.scope && loot.scope !== SCOPES.NONE) {

          const oldScope = playerInventory.scope;

          playerInventory.scope = loot.scope;

          currentScope = loot.scope;

          loot.scope = null;

          pickedAnything = true;

          showNotice(`시체상자에서 [${currentScope.name}] 장착!`);

          if (oldScope !== SCOPES.NONE) {

            spawnGroundItem(playerPos.clone(), 'SCOPE', oldScope);

          }

        }

        else if (targetType === 'helmet' && loot.helmet) {

          const oldHelmet = playerInventory.helmet;

          playerInventory.helmet = loot.helmet;

          loot.helmet = null;

          pickedAnything = true;

          showNotice(`시체상자에서 [${playerInventory.helmet.name}] 장착!`);

          playerSoldier.updateHelmetVisual(playerInventory.helmet);

          if (oldHelmet) {

            spawnGroundItem(playerPos.clone(), 'HELMET', oldHelmet);

          }

        }

        else if (targetType === 'bag' && loot.bag) {

          const oldBag = playerInventory.bag;

          playerInventory.bag = loot.bag;

          loot.bag = null;

          pickedAnything = true;

          showNotice(`시체상자에서 [${playerInventory.bag.name}] 장착!`);

          playerSoldier.updateBagVisual(playerInventory.bag);

          if (oldBag) {

            spawnGroundItem(playerPos.clone(), 'BAG', oldBag);

          }

        }

        else if (targetType === 'firstaid' && loot.firstaids && loot.firstaids > 0) {

          const spaceLeft = maxCapacity - (playerInventory.grenades + playerInventory.smokes + playerInventory.firstaids);

          if (spaceLeft > 0) {

            const pickCount = Math.min(loot.firstaids, spaceLeft);

            loot.firstaids -= pickCount;

            playerInventory.firstaids += pickCount;

            pickedAnything = true;

            showNotice(`시체상자에서 [구급상자] ${pickCount}개 획득!`);

          } else {

            showNotice("가방 공간 부족으로 구급상자를 줍지 못했습니다.");

          }

        }

        else if (targetType === 'grenade' && loot.grenades && loot.grenades > 0) {

          const spaceLeft = maxCapacity - (playerInventory.grenades + playerInventory.smokes + playerInventory.firstaids);

          if (spaceLeft > 0) {

            loot.grenades--;

            playerInventory.grenades++;

            pickedAnything = true;

            showNotice("시체상자에서 [수류탄] 획득!");

          } else {

            showNotice("가방 공간 부족으로 수류탄을 줍지 못했습니다.");

          }

        }

        else if (targetType === 'smoke' && loot.smokes && loot.smokes > 0) {

          const spaceLeft = maxCapacity - (playerInventory.grenades + playerInventory.smokes + playerInventory.firstaids);

          if (spaceLeft > 0) {

            loot.smokes--;

            playerInventory.smokes++;

            pickedAnything = true;

            showNotice("시체상자에서 [연막탄] 획득!");

          } else {

            showNotice("가방 공간 부족으로 연막탄을 줍지 못했습니다.");

          }

        }

        else if (targetType === 'ammo' && loot.ammoCount && loot.ammoCount > 0) {

          playerInventory.ammo[loot.ammoType] += loot.ammoCount;

          showNotice(`시체상자에서 [${getAmmoName(loot.ammoType)}] ${loot.ammoCount}발 획득!`);

          loot.ammoCount = 0;

          loot.ammoType = null;

          pickedAnything = true;

        }

        

        // Clean up empty crate:

        const hasWeapon = !!loot.weapon;

        const hasScope = loot.scope && loot.scope !== SCOPES.NONE;

        const hasHelmet = !!loot.helmet;

        const hasBag = !!loot.bag;

        const hasFirstAid = loot.firstaids && loot.firstaids > 0;

        const hasGrenade = loot.grenades && loot.grenades > 0;

        const hasSmoke = loot.smokes && loot.smokes > 0;

        const hasAmmo = loot.ammoCount && loot.ammoCount > 0;



        if (!hasWeapon && !hasScope && !hasHelmet && !hasBag && !hasFirstAid && !hasGrenade && !hasSmoke && !hasAmmo) {

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        }



        if (pickedAnything) {

          updateEquipUI();

          updateVisualEquip(playerSoldier, currentWeapon, currentScope);

          SoundSystem.playLootSound();

        } else {

          showNotice("상자가 비어있습니다.");

        }

      } else {

        if (loot.type === 'WEAPON') {

          const oldWeapon = playerInventory.weapon;

          playerInventory.weapon = loot.val;

          currentWeapon = loot.val;

          showNotice(`[${currentWeapon.name}] 획득!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

          if (oldWeapon !== WEAPONS.PUNCH) {

            spawnGroundItem(playerPos.clone(), 'WEAPON', oldWeapon);

          }

        } else if (loot.type === 'SCOPE') {

          const oldScope = playerInventory.scope;

          playerInventory.scope = loot.val;

          currentScope = loot.val;

          showNotice(`[${currentScope.name}] 장착 완료!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

          if (oldScope !== SCOPES.NONE) {

            spawnGroundItem(playerPos.clone(), 'SCOPE', oldScope);

          }

        } else if (loot.type === 'HELMET') {

          const oldHelmet = playerInventory.helmet;

          playerInventory.helmet = loot.val;

          showNotice(`[${loot.val.name}] 장착 완료!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

          playerSoldier.updateHelmetVisual(playerInventory.helmet);

          if (oldHelmet) {

            spawnGroundItem(playerPos.clone(), 'HELMET', oldHelmet);

          }

        } else if (loot.type === 'BAG') {

          const oldBag = playerInventory.bag;

          playerInventory.bag = loot.val;

          showNotice(`[${loot.val.name}] 장착 완료!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

          playerSoldier.updateBagVisual(playerInventory.bag);

          if (oldBag) {

            spawnGroundItem(playerPos.clone(), 'BAG', oldBag);

          }

        } else if (loot.type === 'GRENADE') {

          if (currentItemsCount >= maxCapacity) {

            showNotice("가방 공간 부족! (기본 최대 2개)");

            return;

          }

          playerInventory.grenades++;

          showNotice(`수류탄 획득!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'SMOKE') {

          if (currentItemsCount >= maxCapacity) {

            showNotice("가방 공간 부족! (기본 최대 2개)");

            return;

          }

          playerInventory.smokes++;

          showNotice(`연막탄 획득!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'FIRSTAID') {

          if (currentItemsCount >= maxCapacity) {

            showNotice("가방 공간 부족! (기본 최대 2개)");

            return;

          }

          playerInventory.firstaids++;

          showNotice(`구급상자 획득!`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'AMMO_PISTOL') {

          playerInventory.ammo.PISTOL += 30;

          showNotice(`9mm 탄창 획득! (+30발)`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'AMMO_SHOTGUN') {

          playerInventory.ammo.SHOTGUN += 10;

          showNotice(`12게이지 탄창 획득! (+10발)`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'AMMO_RIFLE') {

          playerInventory.ammo.RIFLE += 60;

          showNotice(`5.56mm 탄창 획득! (+60발)`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        } else if (loot.type === 'AMMO_SNIPER') {

          playerInventory.ammo.SNIPER += 15;

          showNotice(`7.62mm 탄창 획득! (+15발)`);

          scene.remove(loot.mesh);

          lootBoxes.splice(index, 1);

        }

        

        updateEquipUI();

        updateVisualEquip(playerSoldier, currentWeapon, currentScope);

        SoundSystem.playLootSound();

      }

      

      updateInventoryUI();

    };



    // 버리기 핸들러 바인딩 (e.stopPropagation() 추가하여 인벤토리 내 클릭 시 마우스 락 뺏기는 일 방지)

    setTimeout(() => {

      document.getElementById('inv-weapon-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (playerInventory.weapon === WEAPONS.PUNCH) return;

        const oldWeapon = playerInventory.weapon;

        playerInventory.weapon = WEAPONS.PUNCH;

        currentWeapon = WEAPONS.PUNCH;

        spawnGroundItem(playerPos.clone(), 'WEAPON', oldWeapon);

        showNotice(`[${oldWeapon.name}] 버림`);

        updateEquipUI();

        updateVisualEquip(playerSoldier, currentWeapon, currentScope);

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('inv-scope-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (playerInventory.scope === SCOPES.NONE) return;

        const oldScope = playerInventory.scope;

        playerInventory.scope = SCOPES.NONE;

        currentScope = SCOPES.NONE;

        spawnGroundItem(playerPos.clone(), 'SCOPE', oldScope);

        showNotice(`[${oldScope.name}] 버림`);

        updateEquipUI();

        updateVisualEquip(playerSoldier, currentWeapon, currentScope);

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('inv-helmet-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (!playerInventory.helmet) return;

        const oldHelmet = playerInventory.helmet;

        playerInventory.helmet = null;

        spawnGroundItem(playerPos.clone(), 'HELMET', oldHelmet);

        showNotice(`[${oldHelmet.name}] 버림`);

        playerSoldier.updateHelmetVisual(null);

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('inv-bag-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (!playerInventory.bag) return;

        const oldBag = playerInventory.bag;

        playerInventory.bag = null;

        spawnGroundItem(playerPos.clone(), 'BAG', oldBag);

        showNotice(`[${oldBag.name}] 버림`);

        playerSoldier.updateBagVisual(null);

        SoundSystem.playLootSound();

        

        // 가방 분실 시 의료킷/투척류 한도 초과분 바닥에 자동 드롭

        let totalItems = playerInventory.grenades + playerInventory.smokes + playerInventory.firstaids;

        while (totalItems > 2) {

          if (playerInventory.firstaids > 0) {

            playerInventory.firstaids--;

            spawnGroundItem(playerPos.clone(), 'FIRSTAID', { name: '구급상자' });

          } else if (playerInventory.grenades > 0) {

            playerInventory.grenades--;

            spawnGroundItem(playerPos.clone(), 'GRENADE', { name: '수류탄' });

          } else if (playerInventory.smokes > 0) {

            playerInventory.smokes--;

            spawnGroundItem(playerPos.clone(), 'SMOKE', { name: '연막탄' });

          }

          totalItems--;

        }

        updateInventoryUI();

      };



      document.getElementById('inv-firstaid-use-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        startHealing();

      };



      document.getElementById('inv-firstaid-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (playerInventory.firstaids <= 0) return;

        playerInventory.firstaids--;

        spawnGroundItem(playerPos.clone(), 'FIRSTAID', { name: '구급상자' });

        showNotice("구급상자 1개 버림");

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('inv-grenade-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (playerInventory.grenades <= 0) return;

        playerInventory.grenades--;

        spawnGroundItem(playerPos.clone(), 'GRENADE', { name: '수류탄' });

        showNotice("수류탄 1개 버림");

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('inv-smoke-drop-btn').onclick = (e) => {

        if (e) e.stopPropagation();

        if (playerInventory.smokes <= 0) return;

        playerInventory.smokes--;

        spawnGroundItem(playerPos.clone(), 'SMOKE', { name: '연막탄' });

        showNotice("연막탄 1개 버림");

        SoundSystem.playLootSound();

        updateInventoryUI();

      };



      document.getElementById('btn-throw-grenade').onclick = () => { throwThrowable('GRENADE'); };

      document.getElementById('btn-throw-smoke').onclick = () => { throwThrowable('SMOKE'); };

    }, 100);



    function throwThrowable(type) {

      if (gameState !== 'PLAYING' || playerHp <= 0) return;

      if (type === 'GRENADE') {

        if (playerInventory.grenades <= 0) {

          showNotice("수류탄이 없습니다!");

          return;

        }

        playerInventory.grenades--;

      } else if (type === 'SMOKE') {

        if (playerInventory.smokes <= 0) {

          showNotice("연막탄이 없습니다!");

          return;

        }

        playerInventory.smokes--;

      }



      updateInventoryUI();



      const spawnPos = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));

      const throwDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

      throwDir.y += 0.25;

      throwDir.normalize();

      const throwVelocity = throwDir.multiplyScalar(22);



      let tMesh;

      if (type === 'GRENADE') {

        const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x3e503c, metalness: 0.5, roughness: 0.6 });

        tMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), grenadeMat);

      } else {

        const smokeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 });

        const smokeGroup = new THREE.Group();

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 8), smokeMat);

        smokeGroup.add(body);

        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));

        stripe.position.y = 0.05;

        smokeGroup.add(stripe);

        tMesh = smokeGroup;

      }

      tMesh.position.copy(spawnPos);

      tMesh.castShadow = true;

      scene.add(tMesh);



      activeThrowables.push({

        type: type,

        pos: spawnPos,

        vel: throwVelocity,

        mesh: tMesh,

        timer: type === 'GRENADE' ? 3.0 : 4.0

      });



      showNotice(`${type === 'GRENADE' ? '수류탄' : '연막탄'} 투척!`);

    }



    function updateEquipUI() {

      let ammoText = '';

      if (currentWeapon !== WEAPONS.PUNCH) {

        const wKey = currentWeapon.name === '권총' ? 'PISTOL' : (currentWeapon.name === '샷건' ? 'SHOTGUN' : (currentWeapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));

        const loaded = playerInventory.loadedAmmo[wKey];

        const reserve = playerInventory.ammo[wKey];

        const ammoType = currentWeapon.name === '권총' ? '9mm 권총탄' : (currentWeapon.name === '샷건' ? '12게이지 산탄' : (currentWeapon.name === '돌격소총' ? '5.56mm 소총탄' : '7.62mm 저격탄'));

        ammoText = `<br>탄약 규격: <span style="color:#00ffcc">${ammoType}</span><br>보유 탄수: <span style="color:#ffeb3b; font-size:16px; font-weight:bold;">${loaded}</span> / ${reserve}`;

      } else {

        ammoText = `<br>탄약 규격: 없음<br>보유 탄수: -`;

      }

      document.getElementById('equipped-info').innerHTML = `장착 무기: <span style="color:#ffb300; font-weight:bold;">${currentWeapon.name}</span>${ammoText}<br>조준경: <span style="color:#ffeb3b">${currentScope.name}</span>`;

      

      // 모바일 장전 버튼 토글

      const reloadBtn = document.getElementById('btn-reload');

      if (reloadBtn) {

        if (currentWeapon !== WEAPONS.PUNCH) {

          reloadBtn.style.display = 'flex';

        } else {

          reloadBtn.style.display = 'none';

        }

      }

    }



    // 승리 시 떨어질 거대 치킨 관련 전역 변수 및 연출 함수

    let victoryChicken = null;

    function spawnVictoryChicken() {

      const chickenGroup = new THREE.Group();

      

      // 맛있는 황금빛 갈색 로스트 치킨 머티리얼 (약간의 광택 추가)

      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc6691c, roughness: 0.45, metalness: 0.1 });

      const boneMat = new THREE.MeshStandardMaterial({ color: 0xf5eedc, roughness: 0.8 });

      

      // 1) 닭 몸통 (통통한 가슴과 몸통을 위해 메인 구체와 가슴 볼륨 구체 합성)

      const bodyGroup = new THREE.Group();

      const mainBody = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 24), bodyMat);

      mainBody.scale.set(1.4, 0.9, 0.9);

      mainBody.castShadow = true;

      bodyGroup.add(mainBody);

      

      // 통통한 닭가슴살 볼륨감 표현

      const breast = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), bodyMat);

      breast.position.set(0.2, 0.3, 0);

      breast.scale.set(1.1, 0.8, 1.2);

      bodyGroup.add(breast);

      

      // 목 부분 둥근 컷팅 형태

      const neckJoint = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), bodyMat);

      neckJoint.position.set(1.4, 0.1, 0);

      neckJoint.scale.set(0.7, 1.0, 1.0);

      bodyGroup.add(neckJoint);

      

      chickenGroup.add(bodyGroup);

      

      // 2) 닭다리 2개 (북채 Drumsticks와 흰색 다리뼈 및 뼈끝 관절 볼 관절 표현)

      for (let i = -1; i <= 1; i += 2) {

        const legGroup = new THREE.Group();

        legGroup.position.set(-0.5, -0.2, i * 0.7);

        

        // 튼실한 허벅지/종아리 살집 볼륨

        const legMeat = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), bodyMat);

        legMeat.scale.set(1.3, 0.9, 0.9);

        legMeat.rotation.y = -i * Math.PI / 6;

        legMeat.rotation.z = -Math.PI / 8;

        legGroup.add(legMeat);

        

        // 삐져나온 다리뼈 (실제 뼈 느낌의 칼라)

        const legBone = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12), boneMat);

        legBone.position.set(-0.7, -0.4, -i * 0.1);

        legBone.rotation.z = Math.PI / 3;

        legBone.rotation.y = i * Math.PI / 12;

        legGroup.add(legBone);

        

        // 다리뼈 끝 관절 2개 (둥글게 튀어나온 연골 디테일 - 뼈 회전에 맞게 legBone의 자식 객체로 배치하여 이탈 방지)

        const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), boneMat);

        joint1.position.set(-0.07, -0.4, -0.01);

        legBone.add(joint1);

        

        const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), boneMat);

        joint2.position.set(0.07, -0.4, -0.01);

        legBone.add(joint2);

        

        chickenGroup.add(legGroup);

      }

      

      // 3) 닭날개 2개 (끝부분 윙팁 구조를 살려서 3단 정교한 배치)

      for (let i = -1; i <= 1; i += 2) {

        const wingGroup = new THREE.Group();

        wingGroup.position.set(0.4, 0.3, i * 0.85);

        

        // 날개 어깨 부분 (살집)

        const wingShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), bodyMat);

        wingShoulder.scale.set(1.2, 0.7, 0.7);

        wingShoulder.rotation.z = -Math.PI / 6;

        wingGroup.add(wingShoulder);

        

        // 날개 중간 부분 (Wing Flat)

        const wingFlat = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), bodyMat);

        wingFlat.position.set(-0.35, -0.15, i * 0.1);

        wingFlat.scale.set(1.3, 0.5, 0.8);

        wingFlat.rotation.z = Math.PI / 4;

        wingGroup.add(wingFlat);

        

        // 날개 끝 부분 (Wing Tip)

        const wingTip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 12), bodyMat);

        wingTip.position.set(-0.8, -0.3, i * 0.15);

        wingTip.rotation.z = Math.PI / 3;

        wingTip.rotation.x = -i * Math.PI / 12;

        wingGroup.add(wingTip);

        

        chickenGroup.add(wingGroup);

      }



      // 플레이어 앞쪽에 정면 낙하하도록 위치 계산

      const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

      camDir.y = 0;

      camDir.normalize();

      

      const spawnPos = playerPos.clone().addScaledVector(camDir, 5.0);

      spawnPos.y = playerPos.y + 40.0; // 하늘 높이

      

      chickenGroup.position.copy(spawnPos);

      chickenGroup.scale.set(3.5, 3.5, 3.5); // 거대 치킨으로 스케일업

      scene.add(chickenGroup);

      

      victoryChicken = {

        group: chickenGroup,

        velY: -22, // 최초 낙하 속도

        velX: (Math.random() - 0.5) * 6, // 최초 수평 바운스 드리프트

        velZ: (Math.random() - 0.5) * 6,

        targetY: getElevation(spawnPos.x, spawnPos.z),

        bounces: 0,

        landed: false

      };

    }



    function createLiveChickenMesh(type = 'WHITE') {

      const chicken = new THREE.Group();

      chicken.userData = { type: type };

      

      let featherColor = 0xffffff;

      let scaleFactor = 1.0;

      if (type === 'BROWN') {

        featherColor = 0x9c5e2d;

      } else if (type === 'CHICK') {

        featherColor = 0xffeb3b;

        scaleFactor = 0.55;

      }

      

      const bodyMat = new THREE.MeshStandardMaterial({ color: featherColor, roughness: 0.8 });

      const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.6 });

      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.5 });

      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

      

      // Body

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);

      body.scale.set(1.3, 1.0, 1.0);

      body.position.y = 0.4;

      body.castShadow = true;

      chicken.add(body);

      

      // Neck

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8), bodyMat);

      neck.position.set(0.22, 0.52, 0);

      neck.rotation.z = -Math.PI / 6;

      neck.castShadow = true;

      chicken.add(neck);

      

      // Head

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), bodyMat);

      head.name = 'head';

      head.position.set(0.32, 0.65, 0);

      head.castShadow = true;

      chicken.add(head);

      

      // Beak

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), yellowMat);

      beak.position.set(0.46, 0.63, 0);

      beak.rotation.z = -Math.PI / 2;

      beak.castShadow = true;

      chicken.add(beak);

      

      // Comb (벼슬 - 병아리는 벼슬 없음)

      if (type !== 'CHICK') {

        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.12), redMat);

        comb.position.set(0.30, 0.77, 0);

        comb.rotation.z = Math.PI / 12;

        comb.castShadow = true;

        chicken.add(comb);

      }

      

      // Eyes

      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), darkMat);

      leftEye.position.set(0.36, 0.67, 0.09);

      chicken.add(leftEye);

      

      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), darkMat);

      rightEye.position.set(0.36, 0.67, -0.09);

      chicken.add(rightEye);

      

      // Wings

      const leftWing = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bodyMat);

      leftWing.name = 'wingL';

      leftWing.scale.set(1.4, 0.7, 0.3);

      leftWing.position.set(-0.05, 0.42, 0.28);

      leftWing.rotation.x = Math.PI / 12;

      chicken.add(leftWing);

      

      const rightWing = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bodyMat);

      rightWing.name = 'wingR';

      rightWing.scale.set(1.4, 0.7, 0.3);

      rightWing.position.set(-0.05, 0.42, -0.28);

      rightWing.rotation.x = -Math.PI / 12;

      chicken.add(rightWing);

      

      // Legs

      const leftLegGroup = new THREE.Group();

      leftLegGroup.name = 'legL';

      leftLegGroup.position.set(-0.05, 0.3, 0.12);

      

      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), yellowMat);

      leftLeg.position.y = -0.15;

      leftLeg.castShadow = true;

      leftLegGroup.add(leftLeg);

      

      const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.08), yellowMat);

      leftFoot.position.set(0.07, -0.3, 0);

      leftLegGroup.add(leftFoot);

      

      chicken.add(leftLegGroup);

      

      const rightLegGroup = new THREE.Group();

      rightLegGroup.name = 'legR';

      rightLegGroup.position.set(-0.05, 0.3, -0.12);

      

      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), yellowMat);

      rightLeg.position.y = -0.15;

      rightLeg.castShadow = true;

      rightLegGroup.add(rightLeg);

      

      const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.08), yellowMat);

      rightFoot.position.set(0.07, -0.3, 0);

      rightLegGroup.add(rightFoot);

      

      chicken.add(rightLegGroup);

      

      chicken.scale.set(scaleFactor, scaleFactor, scaleFactor);

      

      return chicken;

    }



    function createRoastedChickenMesh() {

      const chickenGroup = new THREE.Group();

      

      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc6691c, roughness: 0.45, metalness: 0.1 });

      const boneMat = new THREE.MeshStandardMaterial({ color: 0xf5eedc, roughness: 0.8 });

      

      const bodyGroup = new THREE.Group();

      const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bodyMat);

      mainBody.scale.set(1.4, 0.9, 0.9);

      mainBody.castShadow = true;

      bodyGroup.add(mainBody);

      

      const breast = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), bodyMat);

      breast.position.set(0.06, 0.09, 0);

      breast.scale.set(1.1, 0.8, 1.2);

      bodyGroup.add(breast);

      

      const neckJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bodyMat);

      neckJoint.position.set(0.42, 0.03, 0);

      neckJoint.scale.set(0.7, 1.0, 1.0);

      bodyGroup.add(neckJoint);

      

      chickenGroup.add(bodyGroup);

      

      for (let i = -1; i <= 1; i += 2) {

        const legGroup = new THREE.Group();

        legGroup.position.set(-0.15, -0.06, i * 0.2);

        

        const legMeat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), bodyMat);

        legMeat.scale.set(1.3, 0.9, 0.9);

        legMeat.rotation.y = -i * Math.PI / 6;

        legMeat.rotation.z = -Math.PI / 8;

        legGroup.add(legMeat);

        

        const legBone = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.24, 8), boneMat);

        legBone.position.set(-0.21, -0.12, -i * 0.03);

        legBone.rotation.z = Math.PI / 3;

        legBone.rotation.y = i * Math.PI / 12;

        legGroup.add(legBone);

        

        const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), boneMat);

        joint1.position.set(-0.02, -0.12, -0.003);

        legBone.add(joint1);

        

        const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), boneMat);

        joint2.position.set(0.02, -0.12, -0.003);

        legBone.add(joint2);

        

        chickenGroup.add(legGroup);

      }

      

      for (let i = -1; i <= 1; i += 2) {

        const wingGroup = new THREE.Group();

        wingGroup.position.set(0.12, 0.09, i * 0.25);

        

        const wingShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 8), bodyMat);

        wingShoulder.scale.set(1.2, 0.7, 0.7);

        wingShoulder.rotation.z = -Math.PI / 6;

        wingGroup.add(wingShoulder);

        

        const wingFlat = new THREE.Mesh(new THREE.SphereGeometry(0.096, 8, 8), bodyMat);

        wingFlat.position.set(-0.1, -0.045, i * 0.03);

        wingFlat.scale.set(1.3, 0.5, 0.8);

        wingFlat.rotation.z = Math.PI / 4;

        wingGroup.add(wingFlat);

        

        chickenGroup.add(wingGroup);

      }

      

      return chickenGroup;

    }



    function transformCratesIntoChickens() {

      for (let i = lootBoxes.length - 1; i >= 0; i--) {

        const item = lootBoxes[i];

        if (item.type === 'CRATE') {

          scene.remove(item.mesh);

          

          const types = ['WHITE', 'BROWN', 'CHICK'];

          const randomType = types[Math.floor(Math.random() * types.length)];

          const cMesh = createLiveChickenMesh(randomType);

          cMesh.position.copy(item.mesh.position);

          cMesh.position.y = getElevation(cMesh.position.x, cMesh.position.z);

          scene.add(cMesh);

          

          liveChickens.push({

            mesh: cMesh,

            pos: cMesh.position.clone(),

            dir: new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),

            speed: 1.0,

            wanderTime: 0,

            panicTime: 0,

            animationTime: Math.random() * 10

          });

          

          lootBoxes.splice(i, 1);

        }

      }

    }



    function createShockwave(pos) {

      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });

      const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.3, 16), ringMat);

      ring.rotation.x = -Math.PI / 2;

      ring.position.copy(pos);

      ring.position.y = getElevation(pos.x, pos.z) + 0.1;

      scene.add(ring);

      

      let t = 0;

      const interval = setInterval(() => {

        t += 0.05;

        const s = t * 35;

        ring.scale.set(s, s, s);

        ringMat.opacity = 0.8 - t;

        if (t >= 0.8) {

          clearInterval(interval);

          scene.remove(ring);

          ring.geometry.dispose();

          ringMat.dispose();

        }

      }, 30);

    }



    // 승리 판단 로직

    let hasWonMatch = false;

    let victoryTimer = 0;

    let defeatTimer = 0;

    function checkVictory() {

      if (totalAlive === 1 && playerHp > 0 && !hasWonMatch) {

        hasWonMatch = true;

        victoryTimer = 3.0; // 3초간 슬로우 모션 연출

        

        SoundSystem.stopBGM();

        SoundSystem.playMatchEndSound(true);

        

        spawnVictoryChicken();

        showNotice("🏆 이겼닭! 오늘 저녁은 통닭이닭!", 3000);



        // 자기장 UI 숨기기 및 자기장 활성화 해제

        if (zoneMesh) zoneMesh.visible = false;

        const zoneInfoUI = document.getElementById('zone-info');

        if (zoneInfoUI) zoneInfoUI.style.display = 'none';

      }

    }



    function showVictoryUI() {

      document.exitPointerLock();

      

      const vBox = document.getElementById('victory-box');

      const vStats = document.getElementById('victory-stats');

      if (vStats) {

        vStats.innerHTML = `최종 생존자: 1명 (우승!)<br>나의 처치 수: <strong style="color: #ffeb3b; font-size: 20px;">${killCount}</strong> 킬`;

      }

      if (vBox) {

        vBox.style.display = 'block';

      }

      

      const restartBtn = document.getElementById('victory-restart-btn');

      if (restartBtn) {

        restartBtn.onclick = () => window.location.reload();

      }

      

      const continueBtn = document.getElementById('victory-continue-btn');

      if (continueBtn) {

        continueBtn.onclick = () => {

          vBox.style.display = 'none';

          transformCratesIntoChickens();

          

          // 화면 우측 상단에 다시 도전하기 전용 플로팅 미니 버튼 표시

          const miniBtn = document.getElementById('victory-mini-btn');

          if (miniBtn) {

            miniBtn.style.display = 'block';

            miniBtn.onclick = () => window.location.reload();

          }

          

          // 계속 플레이할 수 있도록 포인터 락 재활성화

          try { document.body.requestPointerLock(); } catch(err) {}

        };

      }

    }



    let hasRevived = false;

    let playerInvincibleTime = 0;

    let selectedReviveHp = 100;



    function startReviveSlotMachine() {

      document.exitPointerLock();

      

      const modal = document.getElementById('revive-modal');

      const slotVal = document.getElementById('slot-value');

      const promptText = document.getElementById('revive-prompt-text');

      const buttons = document.getElementById('revive-buttons');

      const yesBtn = document.getElementById('revive-yes-btn');

      const noBtn = document.getElementById('revive-no-btn');

      

      modal.style.display = 'block';

      promptText.style.display = 'none';

      buttons.style.display = 'none';

      slotVal.style.color = '#00ffcc';

      

      let spinCount = 0;

      const totalSpins = 20;

      

      const spinInterval = setInterval(() => {

        spinCount++;

        const tempHp = (1 + Math.floor(Math.random() * 10)) * 10;

        slotVal.innerText = tempHp + '%';

        SoundSystem.playDryClick();

        

        if (spinCount >= totalSpins) {

          clearInterval(spinInterval);

          selectedReviveHp = (1 + Math.floor(Math.random() * 10)) * 10;

          slotVal.innerText = selectedReviveHp + '%';

          

          slotVal.style.color = '#ffeb3b';

          SoundSystem.playHealSound();

          

          setTimeout(() => {

            document.getElementById('revive-hp-percentage').innerText = selectedReviveHp + '%';

            promptText.style.display = 'block';

            buttons.style.display = 'flex';

          }, 500);

        }

      }, 80);

      

      yesBtn.onclick = () => {

        modal.style.display = 'none';

        startRewardedAd();

      };

      

      noBtn.onclick = () => {

        modal.style.display = 'none';

        showDefeatUI();

        gameState = 'FINISHED';

      };

    }



    let adTimerInterval = null;

    let adTriggered = false;

    function startRewardedAd() {

      // 로컬 테스트(file://) 환경인 경우 시뮬레이션 광고 구동

      if (window.location.protocol === 'file:') {

        runSimulatedAd();

        return;

      }



      // 실제 호스팅 도메인 환경인 경우 구글 애드센스 H5 보상형 광고 구동

      SoundSystem.stopSkydiveWindSound();

      SoundSystem.stopBGM();

      

      adTriggered = false;



      if (typeof window.adBreak === 'function') {

        const adTimeout = setTimeout(() => {

          if (!adTriggered) {

            console.warn("AdSense SDK did not respond in time (possible adblocker).");

            showAdblockNotice();

          }

        }, 2000);



        try {

          window.adBreak({

            type: 'reward',

            name: 'RevivePlayer',

            beforeAd: () => {

              adTriggered = true;

              clearTimeout(adTimeout);

              console.log("AdSense: 광고 시작됨");

            },

            afterAd: () => {

              console.log("AdSense: 광고 닫힘");

            },

            beforeReward: (showReward) => {

              console.log("AdSense: 보상 조건 충족");

              showReward(executeRevival);

            },

            adDismissed: () => {

              console.log("AdSense: 광고 스킵됨");

              showDefeatUI();

              gameState = 'FINISHED';

            },

            adViewed: () => {

              console.log("AdSense: 광고 시청 성공");

            },

            adError: (err) => {

              adTriggered = true;

              clearTimeout(adTimeout);

              console.error("AdSense: 광고 에러 발생:", err);

              showAdblockNotice();

            }

          });

        } catch (err) {

          console.error("Error executing window.adBreak:", err);

          clearTimeout(adTimeout);

          showAdblockNotice();

        }

      } else {

        console.warn("window.adBreak is not a function (blocked by adblocker).");

        showAdblockNotice();

      }

    }



    function showAdblockNotice() {

      showNotice("⚠️ 광고를 불러오지 못했습니다. 광고 차단 프로그램(AdBlock)을 해제하고 다시 도전해주세요.", 5000);

      showDefeatUI();

      gameState = 'FINISHED';

    }



    function runSimulatedAd() {

      const adScreen = document.getElementById('ad-screen');

      const adTimerText = document.getElementById('ad-timer');

      const adMuteBtn = document.getElementById('ad-mute-btn');

      

      adScreen.style.display = 'flex';

      

      let adTimeRemaining = 15;

      adTimerText.innerText = `광고 종료까지 ${adTimeRemaining}초...`;

      

      let isMuted = false;

      adMuteBtn.innerText = '🔊 음소거';

      adMuteBtn.onclick = () => {

        isMuted = !isMuted;

        adMuteBtn.innerText = isMuted ? '🔇 소리 켜기' : '🔊 음소거';

      };

      

      SoundSystem.stopSkydiveWindSound();

      

      adTimerInterval = setInterval(() => {

        adTimeRemaining--;

        if (adTimeRemaining > 0) {

          adTimerText.innerText = `광고 종료까지 ${adTimeRemaining}초...`;

          if (!isMuted) {

            SoundSystem.playDryClick();

          }

        } else {

          clearInterval(adTimerInterval);

          adScreen.style.display = 'none';

          executeRevival();

        }

      }, 1000);

    }



    function executeRevival() {

      hasRevived = true;

      playerHp = selectedReviveHp;

      

      document.getElementById('player-hp-text').innerText = 'HP: ' + playerHp;

      document.getElementById('player-hp-bar-fill').style.width = playerHp + '%';

      

      playerStance = 'STAND';

      myPlayerGroup.rotation.set(0, 0, 0);

      myPlayerGroup.position.copy(playerPos);

      myPlayerGroup.position.y = getElevation(playerPos.x, playerPos.z, playerPos.y);

      isGrounded = true;

      playerVelocityY = 0;

      

      playerInvincibleTime = 3.0;

      

      const offset = new THREE.Vector3(0, 3.5, 10);

      offset.applyQuaternion(camera.quaternion);

      camera.position.copy(playerPos).add(offset);

      

      document.getElementById('throw-shortcuts').style.display = 'flex';

      

      gameState = 'PLAYING';

      

      if (bgmEnabled) {

        SoundSystem.playBGM();

      }

      

      try { document.body.requestPointerLock(); } catch(err) {}

      

      showNotice(`✨ 부활 성공! ${selectedReviveHp}% 체력으로 다시 시작합니다.`, 4000);

    }



    function showDefeatUI() {

      document.exitPointerLock();

      

      // 1. 주변 소리(SFX) 서서히 줄어들면서 제거 (2.5초간 페이드아웃)

      if (audioCtx && sfxVolumeNode) {

        try {

          sfxVolumeNode.gain.cancelScheduledValues(audioCtx.currentTime);

          sfxVolumeNode.gain.setValueAtTime(sfxVolumeNode.gain.value, audioCtx.currentTime);

          sfxVolumeNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);

        } catch(e) {}

      }

      

      // 2. 로비 BGM 서서히 페이드인하며 재생

      bgmEnabled = true;

      const bgmBtn = document.getElementById('btn-toggle-bgm');

      if (bgmBtn) bgmBtn.innerText = "🎵 BGM: ON";

      SoundSystem.playBGM();



      document.getElementById('overlay').style.display = 'flex'; 

      document.getElementById('main-title').innerText = '☠️ 당신은 처치되었습니다';

      document.getElementById('main-title').style.color = '#ff3333';

      document.getElementById('sub-title').style.display = 'none';

      document.getElementById('instruction').innerHTML = `최종 생존자: ${totalAlive}명<br>나의 킬 수: ${killCount}<br><br><button id="restart-btn" style="margin-top: 20px; padding: 15px 40px; font-size: 18px; font-weight: bold; background: #e53935; color: white; border: none; border-radius: 25px; cursor: pointer;">다시 도전하기</button>`;

      document.getElementById('start-btn').style.display = 'none';

      

      setTimeout(() => {

        const btn = document.getElementById('restart-btn');

        if (btn) btn.addEventListener('click', () => window.location.reload());

      }, 100);

    }



    // 적 머리 위 체력바 생성 로직

    const enemyHpContainer = document.getElementById('enemy-hp-container');

    function createEnemyHpBar(enemyId) {

      const bg = document.createElement('div'); bg.className = 'enemy-hp-bar-bg'; bg.id = 'hp-bg-' + enemyId;

      bg.style.width = '72px';

      bg.style.height = '15px';

      bg.style.display = 'none';

      bg.style.flexDirection = 'column';

      bg.style.alignItems = 'center';

      bg.style.justifyContent = 'center';

      bg.style.background = 'rgba(0,0,0,0.7)';

      bg.style.border = '1px solid white';

      bg.style.borderRadius = '4px';

      bg.style.padding = '1px';

      

      const label = document.createElement('div'); 

      label.id = 'hp-label-' + enemyId;

      label.style.fontSize = '8px';

      label.style.fontWeight = 'bold';

      label.style.color = 'white';

      label.style.marginBottom = '1px';

      label.innerText = '';

      

      const fill = document.createElement('div'); fill.className = 'enemy-hp-bar-fill'; fill.id = 'hp-fill-' + enemyId;

      fill.style.height = '4px';

      fill.style.width = '100%';

      fill.style.borderRadius = '2px';

      

      bg.appendChild(label);

      bg.appendChild(fill); 

      enemyHpContainer.appendChild(bg);

      return { bg, fill, label };

    }



    function updatePlayerHp(amount, shooterPos = null) {

      if(playerHp <= 0) return;

      if(playerInvincibleTime > 0 && amount < 0) return;

      playerHp += amount; if(playerHp < 0) playerHp = 0; if(playerHp > 100) playerHp = 100;

      document.getElementById('player-hp-text').innerText = 'HP: ' + Math.ceil(playerHp);

      document.getElementById('player-hp-bar-fill').style.width = playerHp + '%';

      

      if(amount < 0) {

        SoundSystem.playPainSound();

        

        // --- [방향성 피격 인디케이터 연출] ---

        const damageInd = document.getElementById('damage-indicator');

        damageInd.style.display = 'block';

        

        if (shooterPos) {

          // 사수 방향으로 붉은 그라데이션 회전 계산

          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

          forward.y = 0; forward.normalize();

          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

          right.y = 0; right.normalize();

          

          const toShooter = new THREE.Vector3().subVectors(shooterPos, playerPos);

          toShooter.y = 0; toShooter.normalize();

          

          const fwdDot = toShooter.dot(forward);

          const rgtDot = toShooter.dot(right);

          

          let angleDeg = Math.atan2(rgtDot, fwdDot) * (180 / Math.PI);

          angleDeg = (angleDeg + 360) % 360;

          

          // conic-gradient의 시작점 조정을 통해 붉은 지시선이 피해 진원 방향을 정교하게 지목하도록 설정

          const startAngle = (angleDeg - 180 + 360) % 360;

          damageInd.style.background = `conic-gradient(from ${startAngle}deg, transparent 0deg, transparent 140deg, rgba(255,0,0,0.85) 180deg, transparent 220deg, transparent 360deg)`;

          damageInd.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0.4)';

        } else {

          // 방향 모를 때 (자기장 등) 전체 화면 붉은색

          damageInd.style.background = 'transparent';

          damageInd.style.boxShadow = 'inset 0 0 150px rgba(255,0,0,0.9)';

        }



        // 1.2초간 매끄럽게 피격 오버레이가 페이드아웃 되도록 애니메이션 처리

        damageInd.style.animation = 'none';

        damageInd.offsetHeight; // reflow 트리거

        damageInd.style.animation = 'dmgFade 1.2s forwards';



        if (damageInd.timeoutId) clearTimeout(damageInd.timeoutId);

        damageInd.timeoutId = setTimeout(() => { damageInd.style.display = 'none'; }, 1200);

        

        if (isHealing) {

          isHealing = false;

          document.getElementById('heal-progress-container').style.display = 'none';

          showNotice("⚠️ 피해를 입어 구급상자 사용이 취소되었습니다.");

        }

      }

      if(playerHp <= 0 && gameState !== 'DEFEAT' && gameState !== 'FINISHED') {

        gameState = 'DEFEAT';

        defeatTimer = 3.0; // 3초간 슬로우 모션 연출

        document.exitPointerLock();

        document.getElementById('throw-shortcuts').style.display = 'none';

        

        SoundSystem.stopBGM();

        SoundSystem.playMatchEndSound(false);



        showNotice("☠️ 당신은 처치되었습니다...", 3000);

      }

    }



    function addKillLog(msg) {

      const feed = document.getElementById('kill-feed'); const div = document.createElement('div');

      div.className = 'kill-log'; div.innerText = msg; feed.appendChild(div);

      setTimeout(() => { if(div.parentNode) div.parentNode.removeChild(div); }, 4000);

      document.getElementById('alive-count').innerText = totalAlive;

    }



    const activeThrowables = [];

    const activeSmokeClouds = [];



    for(let i=1; i<50; i++) { 

      const soldier = createSoldierModel(0x4a5a4a, 0xffd0b0);

      const group = soldier.group;

      const eParachute = parachute.clone(); eParachute.visible = false; 

      eParachute.position.set(0, 5.5, 0); // 10.0에서 5.5로 줄임

      group.add(eParachute);

      group.position.copy(planeGroup.position); scene.add(group);

      

      // AI 장비 및 티어 랜덤 생성

      // 난이도 설정에 따른 동적 AI 출현 가중치 결정
          let pNoob = 0.60;
          let pPro = 0.90;
          if (matchDifficulty === 'Easy') {
            pNoob = 0.85;
            pPro = 0.98;
          } else if (matchDifficulty === 'Hard') {
            pNoob = 0.35;
            pPro = 0.75;
          } else if (matchDifficulty === 'Real-Combat') {
            pNoob = 0.15;
            pPro = 0.55;
          }
          const randTier = Math.random();

      let tier = 'Noob';

      let maxHp = 85;

      let selectedHelmet = null;

      let selectedBag = null;

      

      if (randTier < 0.60) {

        tier = 'Noob';

        maxHp = 85;

        selectedHelmet = Math.random() > 0.6 ? HELMETS.LV1 : null;

        selectedBag = Math.random() > 0.6 ? BAGS.LV1 : null;

      } else if (randTier < 0.90) {

        tier = 'Pro';

        maxHp = 100;

        selectedHelmet = Math.random() > 0.3 ? (Math.random() > 0.5 ? HELMETS.LV2 : HELMETS.LV1) : null;

        selectedBag = Math.random() > 0.3 ? (Math.random() > 0.5 ? BAGS.LV2 : BAGS.LV1) : null;

      } else {

        tier = 'Hacker';

        maxHp = 150;

        selectedHelmet = HELMETS.LV3;

        selectedBag = BAGS.LV3;

        

        // 해커 외관 커스텀: 붉은색과 금색 발광

        const hackerTorsoMat = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.9, roughness: 0.1, emissive: 0x330000 });

        const hackerLimbMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1, emissive: 0x332200 });

        

        if (soldier.body) soldier.body.material = hackerTorsoMat;

        if (soldier.headGroup && soldier.headGroup.children[0]) {

          soldier.headGroup.children[0].material = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.5, roughness: 0.2, emissive: 0x220000 });

        }

        if (soldier.leftArm && soldier.leftArm.children[0]) soldier.leftArm.children[0].material = hackerLimbMat;

        if (soldier.rightArm && soldier.rightArm.children[0]) soldier.rightArm.children[0].material = hackerLimbMat;

        if (soldier.leftLeg && soldier.leftLeg.children[0]) soldier.leftLeg.children[0].material = hackerLimbMat;

        if (soldier.rightLeg && soldier.rightLeg.children[0]) soldier.rightLeg.children[0].material = hackerLimbMat;

      }

      

      if (selectedHelmet) soldier.updateHelmetVisual(selectedHelmet);

      soldier.parachuteBag.visible = true;

      

      const eid = 'AI_' + i;

      const hpUI = createEnemyHpBar(eid);

      

      updateVisualEquip(soldier, WEAPONS.PUNCH, SCOPES.NONE);

      

      enemies.push({ id: eid, mesh: group, soldier: soldier, hp: maxHp, maxHp: maxHp, state: 'IN_PLANE', parachute: eParachute, hpUI: hpUI, tier: tier,

        jumpTime: 3.5 + Math.random() * 9.5, weapon: WEAPONS.PUNCH, helmet: selectedHelmet, bag: selectedBag, lastShot: 0, lastHitTime: -9999,

        driftAngle: Math.random() * Math.PI * 2, driftSpeed: 10 + Math.random() * 15, recoilTime: 0,

        avoidanceTimer: 0, avoidDir: new THREE.Vector3() });

        

      // HP UI의 등급 텍스트 및 초기 색상 설정

      hpUI.label.innerText = `[${tier}] ${eid}`;

      if (tier === 'Noob') {

        hpUI.fill.style.backgroundColor = '#81c784';

        hpUI.label.style.color = '#a5d6a7';

      } else if (tier === 'Pro') {

        hpUI.fill.style.backgroundColor = '#ffd54f';

        hpUI.label.style.color = '#ffe082';

      } else {

        hpUI.fill.style.backgroundColor = '#ff3d00';

        hpUI.label.style.color = '#ff8a80';

        hpUI.label.style.textShadow = '0 0 4px #ff3d00';

      }

    }



    function getAmmoName(wKey) {

      if (wKey === 'PISTOL') return '9mm 탄창';

      if (wKey === 'SHOTGUN') return '12게이지 탄창';

      if (wKey === 'RIFLE') return '5.56mm 탄창';

      if (wKey === 'SNIPER') return '7.62mm 탄창';

      return '';

    }



    function createAmmoBoxMesh(colorHex) {

      const group = new THREE.Group();

      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.25), new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 }));

      box.castShadow = true;

      group.add(box);

      const label = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.19, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));

      label.position.set(0, 0, 0.13);

      group.add(label);

      return group;

    }



    function spawnGroundItem(pos, itemType, itemValue) {

      const itemGroup = new THREE.Group();

      

      let visualMesh;

      if (itemType === 'WEAPON') {

        visualMesh = createWeaponMesh(itemValue, SCOPES.NONE);

        if (visualMesh) {

          // Counteract hand offsets and center the weapon

          if (itemValue && itemValue.name === '권총') {

            visualMesh.position.set(0, 0.03, -0.01);

          } else {

            visualMesh.position.set(0, 0.11, -0.01);

          }

          // Scale to 3.5 and lay it flat horizontally on its side with a random heading

          visualMesh.scale.set(3.5, 3.5, 3.5);

          visualMesh.rotation.set(0, Math.random() * Math.PI * 2, Math.PI / 2);

        }

      } else if (itemType === 'SCOPE') {

        const scopeMat = new THREE.MeshStandardMaterial({ color: 0x2e5c30, metalness: 0.8, roughness: 0.3 });

        const lensMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        

        const scopeGroup = new THREE.Group();

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4), scopeMat);

        body.rotation.x = Math.PI / 2;

        scopeGroup.add(body);

        

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02), lensMat);

        lens.rotation.x = Math.PI / 2;

        lens.position.z = 0.201;

        scopeGroup.add(lens);

        

        visualMesh = scopeGroup;

        visualMesh.scale.set(2, 2, 2);

      } else if (itemType === 'HELMET') {

        const helmetColor = itemValue === HELMETS.LV1 ? 0x4caf50 : (itemValue === HELMETS.LV2 ? 0x009688 : 0x212121);

        const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.8, side: THREE.DoubleSide });

        const helmetMesh = new THREE.Group();

        

        // 1) 헬멧 돔 본체

        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI*2, 0, Math.PI/2), helmetMat);

        dome.rotation.x = -Math.PI/2;

        dome.castShadow = true;

        helmetMesh.add(dome);



        // 3단계 헬멧인 경우 바이저 추가

        if (itemValue === HELMETS.LV3) {

          const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }));

          visor.position.set(0, -0.06, 0.20);

          helmetMesh.add(visor);

        }

        

        visualMesh = helmetMesh;

        visualMesh.scale.set(1.5, 1.5, 1.5);

      } else if (itemType === 'BAG') {

        const bagColor = itemValue === BAGS.LV1 ? 0x8d6e63 : (itemValue === BAGS.LV2 ? 0x5d4037 : 0x3e2723);

        const bagMat = new THREE.MeshStandardMaterial({ color: bagColor, roughness: 0.8 });

        const bagGroup = new THREE.Group();

        const mainBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.14), bagMat);

        bagGroup.add(mainBox);

        const strapMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.37, 0.02), strapMat);

        strapL.position.set(-0.08, 0, 0.075);

        const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.37, 0.02), strapMat);

        strapR.position.set(0.08, 0, 0.075);

        bagGroup.add(strapL); bagGroup.add(strapR);

        visualMesh = bagGroup;

        visualMesh.scale.set(2.0, 2.0, 2.0);

      } else if (itemType === 'GRENADE') {

        const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x3e503c, metalness: 0.5, roughness: 0.6 });

        const grenadeMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), grenadeMat);

        visualMesh = grenadeMesh;

        visualMesh.scale.set(1.8, 1.8, 1.8);

      } else if (itemType === 'SMOKE') {

        const smokeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 });

        const smokeGroup = new THREE.Group();

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 8), smokeMat);

        smokeGroup.add(body);

        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 8), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

        stripe.position.y = 0.04;

        smokeGroup.add(stripe);

        visualMesh = smokeGroup;

        visualMesh.scale.set(2.0, 2.0, 2.0);

      } else if (itemType === 'FIRSTAID') {

        const kitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

        const crossMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const kitGroup = new THREE.Group();

        const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), kitMat);

        kitGroup.add(box);

        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.02), crossMat);

        crossH.position.z = 0.076;

        kitGroup.add(crossH);

        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.02), crossMat);

        crossV.position.z = 0.076;

        kitGroup.add(crossV);

        visualMesh = kitGroup;

        visualMesh.scale.set(2.0, 2.0, 2.0);

        visualMesh.rotation.x = -Math.PI / 2;

      } else if (itemType === 'AMMO_PISTOL') {

        visualMesh = createAmmoBoxMesh(0xbbbb22);

        visualMesh.scale.set(1.5, 1.5, 1.5);

      } else if (itemType === 'AMMO_SHOTGUN') {

        visualMesh = createAmmoBoxMesh(0xcc2222);

        visualMesh.scale.set(1.5, 1.5, 1.5);

      } else if (itemType === 'AMMO_RIFLE') {

        visualMesh = createAmmoBoxMesh(0x22aa22);

        visualMesh.scale.set(1.5, 1.5, 1.5);

      } else if (itemType === 'AMMO_SNIPER') {

        visualMesh = createAmmoBoxMesh(0x2222bb);

        visualMesh.scale.set(1.5, 1.5, 1.5);

      }

      

      if (visualMesh) {

        visualMesh.traverse(child => {

          if (child.isMesh) {

            child.castShadow = true;

            child.receiveShadow = true;

          }

        });

        itemGroup.add(visualMesh);

      } else {

        const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xff0000 }));

        itemGroup.add(box);

      }

      

      itemGroup.position.copy(pos);

      itemGroup.position.y = getElevation(pos.x, pos.z, pos.y) + 0.8;

      scene.add(itemGroup);

      

      lootBoxes.push({ mesh: itemGroup, type: itemType, val: itemValue, isCrate: false });

    }



    function spawnCorpseBox(pos, weapon, scope, helmet = null, bag = null) {

      const actualWeapon = (weapon && weapon.name !== '주먹' && weapon.name !== '맨주먹') ? weapon : null;

      const actualScope = actualWeapon ? scope : null;



      const boxGroup = new THREE.Group();

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });

      const lidMat = new THREE.MeshStandardMaterial({ color: 0x3d2b22, roughness: 0.9 });

      

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), woodMat);

      base.position.y = 0.4;

      base.castShadow = true;

      boxGroup.add(base);

      

      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.15, 0.84), lidMat);

      lid.position.y = 0.85;

      lid.castShadow = true;

      boxGroup.add(lid);



      const bandMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, emissive: 0x333300 });

      const band = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.82, 0.82), bandMat);

      band.position.y = 0.4;

      boxGroup.add(band);

      

      boxGroup.position.copy(pos);

      boxGroup.position.y = getElevation(pos.x, pos.z, pos.y);

      scene.add(boxGroup);

      

      const firstAidCount = Math.random() < 0.45 ? 1 : (Math.random() < 0.15 ? 2 : 0);

      const grenadeCount = Math.random() < 0.3 ? 1 : 0;

      const smokeCount = Math.random() < 0.3 ? 1 : 0;

      

      let ammoType = null;

      let ammoCount = 0;

      if (actualWeapon) {

        const wName = actualWeapon.name;

        if (wName === '권총') {

          ammoType = 'PISTOL';

          ammoCount = Math.floor(Math.random() * 30) + 15;

        } else if (wName === '샷건') {

          ammoType = 'SHOTGUN';

          ammoCount = Math.floor(Math.random() * 10) + 5;

        } else if (wName === '돌격소총') {

          ammoType = 'RIFLE';

          ammoCount = Math.floor(Math.random() * 60) + 30;

        } else if (wName === '저격소총') {

          ammoType = 'SNIPER';

          ammoCount = Math.floor(Math.random() * 15) + 5;

        }

      }

      

      lootBoxes.push({

        mesh: boxGroup,

        type: 'CRATE',

        weapon: actualWeapon,

        scope: actualScope,

        helmet: helmet,

        bag: bag,

        firstaids: firstAidCount,

        grenades: grenadeCount,

        smokes: smokeCount,

        ammoType: ammoType,

        ammoCount: ammoCount,

        isCrate: true

      });

    }

    

    // 파밍용 상자/아이템 생성 (다양한 장비 및 투척무기 포함)

    for(let i=0; i<250; i++) {

      let rX = 0, rZ = 0, ok = false;

      for (let retries = 0; retries < 150; retries++) {

        rX = (Math.random()-0.5)*460;

        rZ = (Math.random()-0.5)*460;

        if (getElevation(rX, rZ, false) > WATER_LEVEL + 0.5) {

          ok = true;

          break;

        }

      }

      if (!ok) continue;

      const pos = new THREE.Vector3(rX, 0, rZ);

      const randVal = Math.random();

      if(randVal < 0.20) {

        const weapon = wPool[Math.floor(Math.random()*wPool.length)];

        spawnGroundItem(pos, 'WEAPON', weapon);

        

        // Spawn matching ammo nearby

        const wKey = weapon.name === '권총' ? 'PISTOL' : (weapon.name === '샷건' ? 'SHOTGUN' : (weapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));

        const ammoType = 'AMMO_' + wKey;

        const offsetPos = pos.clone().add(new THREE.Vector3((Math.random()-0.5)*1.9, 0, (Math.random()-0.5)*1.9));

        spawnGroundItem(offsetPos, ammoType, { name: getAmmoName(wKey) });

      } else if(randVal < 0.35) {

        spawnGroundItem(pos, 'SCOPE', sPool[Math.floor(Math.random()*sPool.length)]);

      } else if(randVal < 0.50) {

        spawnGroundItem(pos, 'HELMET', hPool[Math.floor(Math.random()*hPool.length)]);

      } else if(randVal < 0.65) {

        spawnGroundItem(pos, 'BAG', bPool[Math.floor(Math.random()*bPool.length)]);

      } else if(randVal < 0.73) {

        spawnGroundItem(pos, 'GRENADE', { name: '수류탄' });

      } else if(randVal < 0.81) {

        spawnGroundItem(pos, 'SMOKE', { name: '연막탄' });

      } else if(randVal < 0.89) {

        spawnGroundItem(pos, 'FIRSTAID', { name: '구급상자' });

      } else {

        // Spawn random ammo

        const wKeys = ['PISTOL', 'SHOTGUN', 'RIFLE', 'SNIPER'];

        const wKey = wKeys[Math.floor(Math.random()*4)];

        const ammoType = 'AMMO_' + wKey;

        spawnGroundItem(pos, ammoType, { name: getAmmoName(wKey) });

      }

    }



    // --- [4. 미니맵/자기장] ---

    let currentZoneRadius = 500; let playZoneRadius = 300; let zoneState = 'WAITING'; let zoneTimer = 35; let shrinkSpeed = 0; 

    const zoneMesh = new THREE.Mesh(new THREE.CylinderGeometry(500, 500, 200, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));

    zoneMesh.position.y = 50; scene.add(zoneMesh);



    function drawMinimap() {

      try {

        const mapCanvas = document.getElementById('minimap'); if(!mapCanvas) return;

        const ctx = mapCanvas.getContext('2d'); ctx.clearRect(0,0,130,130);

        const scale = 130 / mapSize; const cx = 65, cz = 65; 

        ctx.beginPath(); ctx.arc(cx, cz, currentZoneRadius * scale, 0, Math.PI*2);

        ctx.fillStyle = 'rgba(0,50,255,0.2)'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'blue'; ctx.stroke();

        ctx.beginPath(); ctx.arc(cx + playerPos.x * scale, cz + playerPos.z * scale, 3, 0, Math.PI*2);

        ctx.fillStyle = '#00ff00'; ctx.fill();



        // 미니맵에 소리 알림 드로잉

        const elapsed = clock.getElapsedTime();

        recentGunshots.forEach((shot, idx) => {

          if (elapsed - shot.time > shot.life) {

            recentGunshots.splice(idx, 1);

            return;

          }

          const dx = shot.pos.x - playerPos.x;

          const dz = shot.pos.z - playerPos.z;

          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 200) {

            const opacity = 1 - (elapsed - shot.time) / shot.life;

            const sx = cx + dx * scale;

            const sz = cz + dz * scale;

            

            const mx = sx - cx;

            const mz = sz - cz;

            const mdist = Math.sqrt(mx * mx + mz * mz);

            

            ctx.beginPath();

            if (mdist < 60) {

              ctx.arc(sx, sz, 4, 0, Math.PI * 2);

              ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;

              ctx.fill();

            } else {

              const angle = Math.atan2(mz, mx);

              ctx.arc(cx + Math.cos(angle) * 60, cz + Math.sin(angle) * 60, 3, 0, Math.PI * 2);

              ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;

              ctx.fill();

            }

          }

        });

      } catch(e) {} 

    }



    setInterval(() => {

      if(gameState !== 'PLAYING' || playerHp <= 0 || hasWonMatch) return;

      zoneTimer--;

      if(zoneTimer <= 0) {

        if(zoneState === 'WAITING') {

          zoneState = 'SHRINKING'; playZoneRadius = Math.max(40, playZoneRadius - 80);

          zoneTimer = 20; shrinkSpeed = (currentZoneRadius - playZoneRadius) / 20; 

          document.getElementById('zone-text').innerText = '⚠️ 자기장 축소중!'; document.getElementById('zone-text').style.color = '#ff3333';

          showNotice('⚠️ 블루존이 줄어들고 있습니다!');

        } else {

          zoneState = 'WAITING'; zoneTimer = 35;

          document.getElementById('zone-text').innerText = '안전지대 대기중'; document.getElementById('zone-text').style.color = '#4caf50';

        }

      }

      document.getElementById('zone-timer').innerText = zoneTimer;

    }, 1000);



    function tryFastLoot() {

      if (gameState !== 'PLAYING' || playerHp <= 0 || isInventoryOpen) return false;

      

      let nearestItemIndex = -1;

      let minDist = 3.5;

      let nearestCrateIndex = -1;

      let minCrateDist = 3.5;

      

      for (let i = 0; i < lootBoxes.length; i++) {

        const loot = lootBoxes[i];

        const dist = playerPos.distanceTo(loot.mesh.position);

        if (loot.isCrate) {

          if (dist < minCrateDist) {

            minCrateDist = dist;

            nearestCrateIndex = i;

          }

        } else {

          if (dist < minDist) {

            minDist = dist;

            nearestItemIndex = i;

          }

        }

      }

      

      if (nearestItemIndex !== -1) {

        window.pickupItem(nearestItemIndex);

        return true;

      } else if (nearestCrateIndex !== -1) {

        toggleInventory();

        return true;

      }

      return false;

    }



    // --- [5. 사격 처리 및 줌(스코프) 제어] ---

    let isZooming = false; 

    let isLeftMouseDown = false; 

    let lastPlayerShotTime = 0; 

    function updateScopeOverlay() {

      const overlay = document.getElementById('scope-overlay');

      const magText = document.getElementById('scope-mag-text');

      const scopeObj = currentScope || SCOPES.NONE;

      if (isZooming && scopeObj && scopeObj.mag > 1) {

        overlay.style.display = 'flex';

        if (magText) magText.innerText = scopeObj.mag + "X ZOOM";

      } else {

        overlay.style.display = 'none';

      }

    }

    let playerRecoilTime = 0;



    const BulletCache = {

      geometries: {},

      materials: {},

      getOrCreate(weaponName) {

        let type = 'DEFAULT';

        let color = 0xffaa00;

        let size = 0.04;

        let len = 0.4;

        

        if (weaponName === '권총') { type = 'PISTOL'; color = 0xeeee00; size = 0.03; len = 0.3; }

        else if (weaponName === '샷건') { type = 'SHOTGUN'; color = 0xff3300; size = 0.04; len = 0.15; }

        else if (weaponName === '돌격소총') { type = 'RIFLE'; color = 0x00ff44; size = 0.04; len = 0.5; }

        else if (weaponName === '저격총') { type = 'SNIPER'; color = 0x00ffff; size = 0.05; len = 0.8; }

        

        if (!this.geometries[type]) {

          this.geometries[type] = new THREE.BoxGeometry(size, size, len);

          this.materials[type] = new THREE.MeshBasicMaterial({ color: color });

        }

        return { geom: this.geometries[type], mat: this.materials[type] };

      },

      disposeAll() {

        for (let k in this.geometries) {

          this.geometries[k].dispose();

        }

        for (let k in this.materials) {

          this.materials[k].dispose();

        }

        this.geometries = {};

        this.materials = {};

      }

    };



    function fireBullet(shooterPos, targetPos, weapon, shooterId, spread = 0) {

      const baseDir = new THREE.Vector3().subVectors(targetPos, shooterPos).normalize();

      

      // 탄퍼짐(Spread) 적용

      const spreadX = (Math.random() - 0.5) * spread;

      const spreadY = (Math.random() - 0.5) * spread;

      const spreadZ = (Math.random() - 0.5) * spread;

      const dir = baseDir.clone().add(new THREE.Vector3(spreadX, spreadY, spreadZ)).normalize();



      const assets = BulletCache.getOrCreate(weapon.name);

      const bullet = new THREE.Mesh(assets.geom, assets.mat);

      bullet.name = 'bullet';

      bullet.position.copy(shooterPos); bullet.lookAt(shooterPos.clone().add(dir)); scene.add(bullet);

      

      let finalDmg = weapon.dmg;

      if (weapon.name === '샷건') finalDmg = weapon.dmg / 8; // 산탄총은 8발로 나누어 데미지 계산



      if (shooterId !== 'PLAYER') {

        const ai = enemies.find(e => e.id === shooterId);

        if (ai) {

          const mult = ai.tier === 'Noob' ? 0.8 : (ai.tier === 'Pro' ? 1.0 : 1.4);

          finalDmg = weapon.dmg * mult;

        }

      }

      const bulletLife = weapon.range / 60.0;

      enemyBullets.push({ mesh: bullet, dir: dir, life: bulletLife, dmg: finalDmg, owner: shooterId, shooterPos: shooterPos.clone() });



      const wKey = weapon.name === '권총' ? 'PISTOL' : (weapon.name === '샷건' ? 'SHOTGUN' : (weapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));



      if (shooterId !== 'PLAYER') {

        recentGunshots.push({

          pos: shooterPos.clone(),

          time: clock.getElapsedTime(),

          life: 1.5

        });

        const ai = enemies.find(e => e.id === shooterId);

        if (ai && ai.soldier) {

          triggerMuzzleFlash(ai.soldier.weaponContainer);

          ai.recoilTime = 0.15;

        }

        

        // --- [사운드 플레이: 좌우 패닝 시뮬레이션] ---

        const dist = playerPos.distanceTo(shooterPos);

        const vol = Math.max(0, (1 - dist / 220) * 0.30);

        

        if (vol > 0.01) {

          // 플레이어 시야 정면 기준 상대적 각도 계산

          const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

          camDir.y = 0; camDir.normalize();

          const toShooter = new THREE.Vector3().subVectors(shooterPos, playerPos);

          toShooter.y = 0; toShooter.normalize();

          

          const sideDir = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camDir);

          const pan = toShooter.dot(sideDir); // -1(왼쪽) ~ 1(오른쪽)

          

          SoundSystem.playGunshot(wKey, vol, pan);

        }

      } else {

        triggerMuzzleFlash(playerSoldier.weaponContainer);

        playerRecoilTime = 0.15;

        SoundSystem.playGunshot(wKey, 1.0, 0);

      }

    }

    let isReloading = false;

    const maxClipSizes = {

      PISTOL: 7,

      SHOTGUN: 5,

      RIFLE: 30,

      SNIPER: 5

    };



    function startReload() {

      if (gameState !== 'PLAYING' || playerHp <= 0) return;

      if (currentWeapon === WEAPONS.PUNCH) return;

      if (isReloading) return;



      const wKey = currentWeapon.name === '권총' ? 'PISTOL' : (currentWeapon.name === '샷건' ? 'SHOTGUN' : (currentWeapon.name === '돌격소총' ? 'RIFLE' : 'SNIPER'));

      const maxClip = maxClipSizes[wKey];

      const currentLoaded = playerInventory.loadedAmmo[wKey];

      const reserve = playerInventory.ammo[wKey];



      if (currentLoaded >= maxClip) {

        showNotice("이미 탄약이 가득 차 있습니다.");

        return;

      }

      if (reserve <= 0) {

        showNotice("⚠️ 여분 탄약이 없습니다!");

        return;

      }



      isReloading = true;

      SoundSystem.playReloadSound(currentWeapon.name);

      showNotice("🔄 장전 중...");



      setTimeout(() => {

        if (gameState !== 'PLAYING' || playerHp <= 0 || currentWeapon === WEAPONS.PUNCH) {

          isReloading = false;

          return;

        }

        const needed = maxClip - playerInventory.loadedAmmo[wKey];

        const toLoad = Math.min(needed, playerInventory.ammo[wKey]);

        

        playerInventory.loadedAmmo[wKey] += toLoad;

        playerInventory.ammo[wKey] -= toLoad;

        

        isReloading = false;

        showNotice("장전 완료!");

        updateEquipUI();

      }, 1500);

    }



    const centerMouse = new THREE.Vector2(0, 0); const raycaster = new THREE.Raycaster();

    let playerPunchTime = 0;

    let punchSide = 'LEFT';



    function performPlayerAttack() {
      if (gameState !== 'PLAYING' || playerHp <= 0) return;
      if (isReloading || isChambering) return;

      const isSwimming = (getWaterLevel(playerPos.x, playerPos.z) - getElevation(playerPos.x, playerPos.z, false) >= 0.55);
      if (isSwimming) {
        showNotice("⚠️ 수영 중에는 사격할 수 없습니다!");
        return;
      }

      // 무기 객체 레퍼런스 직접 비교로 문자열 인코딩 문제 완벽 회피
      const wKey = currentWeapon === WEAPONS.PISTOL ? 'PISTOL' : 
                   (currentWeapon === WEAPONS.SHOTGUN ? 'SHOTGUN' : 
                   (currentWeapon === WEAPONS.RIFLE ? 'RIFLE' : 'SNIPER'));

      if (currentWeapon !== WEAPONS.PUNCH) {
        if (playerInventory.loadedAmmo[wKey] <= 0) {
          SoundSystem.playDryClick();
          showNotice("⚠️ 탄약 부족! R키로 재장전하십시오.");
          return;
        }
        playerInventory.loadedAmmo[wKey]--;
        updateEquipUI();
      }
      
      lastPlayerShotTime = clock.getElapsedTime();

      // 연사 탄퍼짐 누적 (Recoil Bloom)
      if (currentWeapon === WEAPONS.RIFLE) {
        playerSpreadAccum = Math.min(0.12, playerSpreadAccum + 0.016);
      } else if (currentWeapon === WEAPONS.PISTOL) {
        playerSpreadAccum = Math.min(0.08, playerSpreadAccum + 0.024);
      }

      if (currentWeapon === WEAPONS.PUNCH) {
        playerPunchTime = 0.2;
        punchSide = punchSide === 'LEFT' ? 'RIGHT' : 'LEFT';
        raycaster.setFromCamera(centerMouse, camera);
        let hitEnemy = null;
        let minHitDist = currentWeapon.range;
        
        enemies.forEach(enemy => {
          if(enemy.hp <= 0 || enemy.state !== 'PLAYING') return;
          const distToEnemy = playerPos.distanceTo(enemy.mesh.position);
          if (distToEnemy <= minHitDist) {
            const dirToEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, playerPos).normalize();
            const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            lookDir.y = 0; lookDir.normalize();
            dirToEnemy.y = 0; dirToEnemy.normalize();
            
            const angleCheck = lookDir.dot(dirToEnemy);
            if (angleCheck > 0.7) {
              hitEnemy = enemy;
              minHitDist = distToEnemy;
            }
          }
        });

        if (hitEnemy) {
          hitEnemy.hp -= currentWeapon.dmg;
          hitEnemy.lastHitTime = clock.getElapsedTime();
          showNotice("🎯 적에게 타격을 입혔습니다! (-20 HP)");
          SoundSystem.playPunch(true);
          
          if (hitEnemy.hp <= 0) {
            totalAlive--; killCount++; document.getElementById('kill-count').innerText = killCount;
            spawnCorpseBox(hitEnemy.mesh.position, hitEnemy.weapon, Math.random() > 0.5 ? SCOPES.X2 : SCOPES.NONE, hitEnemy.helmet, hitEnemy.bag);
            scene.remove(hitEnemy.mesh); hitEnemy.hpUI.bg.style.display = 'none';
            addKillLog(`주먹 -> ${hitEnemy.id} 처치`); showNotice("🏆 적을 처치했습니다!");
            checkVictory();
          }
        } else {
          SoundSystem.playPunch(false);
        }
        return;
      }

      raycaster.setFromCamera(centerMouse, camera);
      let targetPoint = null;
      const intersects = raycaster.intersectObjects(scene.children, true);
      let closestHitDist = currentWeapon.range || 120;
      
      if (intersects.length > 0) {
        for (let hit of intersects) {
          let obj = hit.object;
          let isPlayerOrBullet = false;
          while (obj) {
            if (obj === myPlayerGroup || obj.name === 'bullet' || obj.name === 'muzzleflash') {
              isPlayerOrBullet = true;
              break;
            }
            obj = obj.parent;
          }
          if (!isPlayerOrBullet && hit.distance < closestHitDist) {
            closestHitDist = hit.distance;
            targetPoint = hit.point;
          }
        }
      }
      
      if (!targetPoint) {
        targetPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(currentWeapon.range || 120));
      }

      const fireOrigin = playerPos.clone();
      fireOrigin.y += 1.3;

      const aspect = window.innerWidth / window.innerHeight;
      let pan = 0;
      if (aspect > 0.1) {
        const normX = (centerMouse.x + 1) / 2;
        pan = (normX - 0.5) * 2;
      }
      SoundSystem.playGunshot(wKey, 1.0, pan);

      // 샷건일 때 8개의 펠릿(산탄)을 각각 고유한 퍼짐 오차를 주고 발사
      if (currentWeapon === WEAPONS.SHOTGUN) {
        for (let i = 0; i < 8; i++) {
          fireBullet(fireOrigin, targetPoint, currentWeapon, 'PLAYER', 0.18);
        }
      } else {
        // 연사 반동 누적치가 조준 사격과 지향 사격 모두에 사실적으로 작용
        const currentSpread = (isZooming ? 0.015 : 0.15) + playerSpreadAccum;
        fireBullet(fireOrigin, targetPoint, currentWeapon, 'PLAYER', currentSpread);
      }

      // 저격총 사격 시 강제 줌아웃 및 볼트액션 딜레이 적용
      if (wKey === 'SNIPER') {
        isZooming = false;
        updateScopeOverlay();
        isChambering = true;
        setTimeout(() => {
          if (gameState === 'PLAYING' && playerHp > 0) {
            SoundSystem.playReloadSound('저격총');
          }
        }, 350);
        setTimeout(() => {
          isChambering = false;
        }, 1600);
      }
    }


    const moveState = { fwd: false, bwd: false, lft: false, rgt: false, shift: false, jX: 0, jY: 0 };

    const leanState = { left: false, right: false };

    let currentLean = 0; // -1 (좌기울기) ~ 1 (우기울기)

    let isLocked = false;



    const startBtn = document.getElementById('start-btn');

    startBtn.innerText = isTouchDevice ? '매치 시작 (터치)' : '매치 시작';

    

    const handleStartMatch = (e) => {
      // 무작위 난이도 결정 (Easy, Normal, Hard, Real-Combat)
      const diffList = ['Easy', 'Normal', 'Hard', 'Real-Combat'];
      matchDifficulty = diffList[Math.floor(Math.random() * diffList.length)];
      
      if (matchDifficulty === 'Easy') {
        diffIntervalMult = 1.25;
        diffJitterMult = 1.30;
      } else if (matchDifficulty === 'Hard') {
        diffIntervalMult = 0.85;
        diffJitterMult = 0.75;
      } else if (matchDifficulty === 'Real-Combat') {
        diffIntervalMult = 0.70;
        diffJitterMult = 0.55;
      } else {
        diffIntervalMult = 1.0;
        diffJitterMult = 1.0;
      }

      if (e) {

        e.preventDefault();

        e.stopPropagation();

      }

      

      if (gameState !== 'LOBBY') return;

      

      document.getElementById('overlay').style.display = 'none';

      document.getElementById('settings-ui').style.display = 'none';

      initAudio(); // Ensure audio is ready

      SoundSystem.stopBGM();

      

      // 브라우저 전체화면 요청 및 모바일 가로 방향 고정

      const docEl = document.documentElement;

      const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;

      if (requestFs) {

        requestFs.call(docEl).then(() => {

          if (screen.orientation && screen.orientation.lock) {

            screen.orientation.lock('landscape').catch(err => {

              console.log(`Orientation lock error: ${err.message}`);

            });

          }

        }).catch(err => {

          console.log(`Error attempting to enable full-screen mode: ${err.message}`);

        });

      } else {

        if (screen.orientation && screen.orientation.lock) {

          screen.orientation.lock('landscape').catch(err => console.log(err));

        }

      }



      gameState = 'AIRPLANE'; 

      initPlaneSeatsUI();

      document.getElementById('plane-seat-map').style.display = 'flex'; 

      actionBtn.style.display = 'flex'; 

      actionBtn.innerText = isTouchDevice ? '🪂 뛰어내리기' : '🪂 뛰어내리기 (좌클릭/F)'; 

      playerSoldier.parachuteBag.visible = true;

      SoundSystem.playPlaneSound();

      

      // 로비 상태 총기 및 위치 초기화하여 수송기 시작 세팅

      playerPos.copy(planeGroup.position);

      playerInventory.weapon = WEAPONS.PUNCH;

      playerInventory.scope = SCOPES.NONE;

      playerInventory.grenades = 0;

      playerInventory.smokes = 0;

      playerInventory.firstaids = 0;

      currentWeapon = WEAPONS.PUNCH;

      currentScope = SCOPES.NONE;

      updateVisualEquip(playerSoldier, currentWeapon, currentScope);

      myPlayerGroup.visible = false;

      myPlayerGroup.rotation.set(0, 0, 0);

      hasRevived = false;

      playerInvincibleTime = 0;

      

      // Initial camera setup for airplane state

      const startDirection = new THREE.Vector3(1, 0, 1).normalize();

      camera.position.copy(planeGroup.position).sub(startDirection.clone().multiplyScalar(50)).add(new THREE.Vector3(0, 15, 0));

      camera.lookAt(planeGroup.position);



      if (isTouchDevice) { 

        document.getElementById('mobile-ui').style.display = 'block'; 

        document.getElementById('crosshair').style.display = 'block'; 

      } else { 

        document.getElementById('crosshair').style.display = 'block'; 

        document.getElementById('player-hp-ui').style.display = 'block'; 

        try { document.body.requestPointerLock(); } catch(err) {} 

      }

      document.getElementById('top-left-ui').style.display = 'flex';

      document.getElementById('match-info').style.display = 'block';

    };



    startBtn.addEventListener('click', handleStartMatch);

    startBtn.addEventListener('touchstart', handleStartMatch);



    if (isTouchDevice) {

      const joyContainer = document.getElementById('joystick-container'); const joyStick = document.getElementById('joystick-stick');

      let joyId = null, startX=0, startY=0;

      

      document.getElementById('joystick-touch-zone').addEventListener('touchstart', (e) => {

        if(gameState === 'LOBBY') return; if(joyId!==null) return;

        const t = e.changedTouches[0]; joyId = t.identifier; startX = t.clientX; startY = t.clientY;

        joyContainer.style.left = startX+'px'; joyContainer.style.top = startY+'px'; joyContainer.style.display = 'block'; joyStick.style.left = '50%'; joyStick.style.top = '50%';

      }, {passive:true});

      window.addEventListener('touchmove', (e) => {

        if(joyId===null) return; let t = null; for(let i=0; i<e.touches.length; i++) if(e.touches[i].identifier===joyId) t=e.touches[i];

        if(!t) return;

        const dx = t.clientX - startX; const dy = t.clientY - startY;

        const dist = Math.min(50, Math.sqrt(dx*dx+dy*dy)); const angle = Math.atan2(dy, dx);

        joyStick.style.left = (50+Math.cos(angle)*dist)+'px'; joyStick.style.top = (50+Math.sin(angle)*dist)+'px';

        moveState.jX = (Math.cos(angle)*dist)/50; moveState.jY = -(Math.sin(angle)*dist)/50;

      }, {passive:true});

      window.addEventListener('touchend', (e) => {

        for(let i=0; i<e.changedTouches.length; i++) { if(e.changedTouches[i].identifier===joyId) { joyId=null; moveState.jX=0; moveState.jY=0; joyContainer.style.display='none'; } }

      });



      // --- 수정된 시점 이동(Look Zone) 코드 ---

      const lookZone = document.getElementById('touch-look-zone');

      let lookTouchId = null; // 시점 이동 전용 터치 ID 저장

      let prevX = 0, prevY = 0;



      lookZone.addEventListener('touchstart', (e) => { 

        if (lookTouchId !== null) return; // 이미 터치 중이면 무시

        const t = e.changedTouches[0];

        lookTouchId = t.identifier;

        prevX = t.clientX; 

        prevY = t.clientY; 

      }, {passive:true});



      lookZone.addEventListener('touchmove', (e) => {

        if (lookTouchId === null) return;

        

        // 현재 터치 중인 손가락들 중에서 시점 이동용 손가락만 찾기

        let t = null;

        for (let i = 0; i < e.touches.length; i++) {

          if (e.touches[i].identifier === lookTouchId) t = e.touches[i];

        }

        if (!t) return;



        const dx = t.clientX - prevX; 

        const dy = t.clientY - prevY;

        prevX = t.clientX; 

        prevY = t.clientY;



        const eu = new THREE.Euler(0,0,0,'YXZ'); 

        eu.setFromQuaternion(camera.quaternion);

        

        // 스코프 배율에 비례해서 감도를 낮춤 (모바일 감도 최적화)

        const sensitivity = isZooming ? 0.004 / currentScope.mag : 0.008;

        eu.y -= dx * sensitivity; 

        eu.x -= dy * sensitivity; 

        eu.x = Math.max(-1.5, Math.min(1.5, eu.x));

        camera.quaternion.setFromEuler(eu);

      }, {passive:true});



      lookZone.addEventListener('touchend', (e) => { 

        // 뗀 손가락이 시점 이동용 손가락인지 확인

        for (let i = 0; i < e.changedTouches.length; i++) {

          if (e.changedTouches[i].identifier === lookTouchId) {

            lookTouchId = null;

          }

        }

      });

      // ----------------------------------------





      // 공통 버튼 터치 조작 + 드래그 시야 이동(Look) 연동 함수 (모바일 편의성 극대화)

      function makeButtonTrackLook(btnId, actionCallback) {

        const btn = document.getElementById(btnId);

        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {

          e.preventDefault();

          if (actionCallback) actionCallback(e);

          

          // 해당 손가락 터치로 드래그 시야 이동도 같이 할 수 있도록 세팅

          if (lookTouchId === null) {

            const t = e.changedTouches[0];

            lookTouchId = t.identifier;

            prevX = t.clientX;

            prevY = t.clientY;

          }

        });

      }



      makeButtonTrackLook('btn-attack', () => performPlayerAttack());

      makeButtonTrackLook('btn-reload', () => startReload());

      makeButtonTrackLook('btn-aim', () => {

        if (currentWeapon !== WEAPONS.PUNCH) {

          isZooming = !isZooming;

          updateScopeOverlay();

        }

      });

      makeButtonTrackLook('btn-tpp', () => togglePerspective());

      makeButtonTrackLook('btn-inventory', () => toggleInventory());

      makeButtonTrackLook('btn-crouch', () => {

        if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

          playerStance = (playerStance === 'CROUCH') ? 'STAND' : 'CROUCH';

          showNotice(playerStance === 'CROUCH' ? "앉기 (Crouch)" : "서기 (Stand)", 1500);

          if (isHealing) { isHealing = false; document.getElementById('heal-progress-container').style.display = 'none'; }

        }

      });

      makeButtonTrackLook('btn-prone', () => {

        if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

          playerStance = (playerStance === 'PRONE') ? 'STAND' : 'PRONE';

          showNotice(playerStance === 'PRONE' ? "엎드리기 (Prone)" : "서기 (Stand)", 1500);

          if (isHealing) { isHealing = false; document.getElementById('heal-progress-container').style.display = 'none'; }

        }

      });

      makeButtonTrackLook('btn-jump', () => {

        if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

          const vaulted = tryVaultWindow();

          if (!vaulted && isGrounded) {

            playerVelocityY = 7.2;

            isGrounded = false;

            playerStance = 'STAND';

            if (isHealing) { isHealing = false; document.getElementById('heal-progress-container').style.display = 'none'; }

          }

        }

      });

      makeButtonTrackLook('btn-heal', () => startHealing());

      makeButtonTrackLook('btn-interact', () => {

        if (gameState === 'PLAYING') {

          const looted = tryFastLoot();

          if (!looted) tryInteractDoor();

        }

      });

    } else {

      document.addEventListener("pointerlockchange", ()=>{ isLocked = (document.pointerLockElement === document.body); });

      document.addEventListener("click", (e)=>{

        if (document.getElementById("victory-box") && document.getElementById("victory-box").style.display === "block") return;

        if (gameState === "PLAYING" && !isLocked && playerHp > 0) {

          try { document.body.requestPointerLock(); } catch(err) {}

        }

      });

      document.addEventListener('mousemove', (e)=>{

        if (gameState === 'LOBBY') {

          if (isLobbyDragging) {

            const deltaX = e.clientX - prevLobbyMouseX;

            const deltaY = e.clientY - prevLobbyMouseY;

            prevLobbyMouseX = e.clientX;

            prevLobbyMouseY = e.clientY;

            lobbyAngle -= deltaX * 0.005;

            lobbyPitch += deltaY * 0.005;

            lobbyPitch = Math.max(-0.05, Math.min(1.2, lobbyPitch));

          }

          return;

        }

        if(!isLocked) return;

        const eu = new THREE.Euler(0,0,0,'YXZ'); eu.setFromQuaternion(camera.quaternion);

        const sensitivity = isZooming ? 0.002 / currentScope.mag : 0.002;

        eu.y -= e.movementX * sensitivity; 

        eu.x -= e.movementY * sensitivity;

        // 시야각 제한: 위쪽 1.5rad, 아래쪽 일반 시점에선 -1.0rad (스코프 없을 때), 스코프 사용 시 -1.5rad 허용

        const minPitch = isZooming ? -1.5 : -1.0;

        eu.x = Math.max(minPitch, Math.min(1.5, eu.x));

        eu.x = Math.max(-1.5, Math.min(1.5, eu.x)); // 안전 범위 보정

        camera.quaternion.setFromEuler(eu);

        camera.quaternion.setFromEuler(eu);

      });

      document.addEventListener('mousedown', (e)=>{ 
        if (document.getElementById("victory-box") && document.getElementById("victory-box").style.display === "block") return;
        if (gameState === 'LOBBY') {
          isLobbyDragging = true;
          prevLobbyMouseX = e.clientX;
          prevLobbyMouseY = e.clientY;
          return;
        }
        if (gameState === 'AIRPLANE' || gameState === 'FALLING') {
          handleActionBtn();
          return;
        }
        if(!isLocked) return;
        if (e.button === 0) {
          isLeftMouseDown = true;
          performPlayerAttack();
        } 
        if (e.button === 2 && currentWeapon !== WEAPONS.PUNCH && !isChambering) {
          isZooming = true;
          updateScopeOverlay();
        }
      });

      document.addEventListener('mouseup', (e)=>{ 
        if (gameState === 'LOBBY') {
          isLobbyDragging = false;
          return;
        }
        if (e.button === 0) { isLeftMouseDown = false; }
        if (e.button === 2) { isZooming = false; updateScopeOverlay(); } 
      });
      document.addEventListener('mouseleave', () => {

        isLeftMouseDown = false;

      });

      document.addEventListener('mouseleave', ()=>{

        if (gameState === 'LOBBY') {

          isLobbyDragging = false;

        }

      });

      document.addEventListener('wheel', (e)=>{

        if (gameState === 'LOBBY') {

          lobbyDistance += e.deltaY * 0.005;

          lobbyDistance = Math.max(1.8, Math.min(8.0, lobbyDistance));

        }

      }, { passive: true });

      document.addEventListener('keydown', (e)=>{

        if(e.code==='KeyW') moveState.fwd=true; if(e.code==='KeyS') moveState.bwd=true;

        if(e.code==='KeyA') moveState.lft=true; if(e.code==='KeyD') moveState.rgt=true;

        if(e.code==='ShiftLeft' || e.code==='ShiftRight') moveState.shift=true;

        if(e.code==='KeyQ') leanState.left=true;

        if(e.code==='KeyE') leanState.right=true;

        if(e.code==='KeyF') {

          if (gameState === 'AIRPLANE' || gameState === 'FALLING') {

            handleActionBtn();

          } else if (gameState === 'PLAYING') {

            // 주변 아이템 줍기 먼저 시도, 없으면 문 상호작용

            const looted = tryFastLoot();

            if (!looted) {

              tryInteractDoor();

            }

          }

        } 

        if(e.code==='KeyV') togglePerspective(); 

        if(e.code==='Tab') { e.preventDefault(); toggleInventory(); }

        if(e.code==='KeyG') throwThrowable('GRENADE');

        if(e.code==='KeyH') throwThrowable('SMOKE');

        if(e.code==='KeyR') startReload();

        

        // 자세 전환 바인딩

        if(e.code==='KeyC') {

          if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

            playerStance = (playerStance === 'CROUCH') ? 'STAND' : 'CROUCH';

            showNotice(playerStance === 'CROUCH' ? "앉기 (Crouch)" : "서기 (Stand)", 1500);

            if (isHealing) {

              isHealing = false;

              document.getElementById('heal-progress-container').style.display = 'none';

              showNotice("⚠️ 자세 변경으로 구급상자 사용 취소!");

            }

          }

        }

        if(e.code==='KeyZ') {

          if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

            playerStance = (playerStance === 'PRONE') ? 'STAND' : 'PRONE';

            showNotice(playerStance === 'PRONE' ? "엎드리기 (Prone)" : "서기 (Stand)", 1500);

            if (isHealing) {

              isHealing = false;

              document.getElementById('heal-progress-container').style.display = 'none';

              showNotice("⚠️ 자세 변경으로 구급상자 사용 취소!");

            }

          }

        }

        // 점프 & 파쿠르

        if(e.code==='Space') {

          if (gameState === 'PLAYING' && playerHp > 0 && !isVaulting) {

            // 창문 파쿠르 먼저 시도

            const vaulted = tryVaultWindow();

            if (!vaulted && isGrounded) {

              // 실패 시 점프 실행

              playerVelocityY = 7.2;

              isGrounded = false;

              playerStance = 'STAND'; // 점프 시 강제 서기 상태로

              if (isHealing) {

                isHealing = false;

                document.getElementById('heal-progress-container').style.display = 'none';

                showNotice("⚠️ 점프로 인해 구급상자 사용 취소!");

              }

            }

          }

        }

      });

      document.addEventListener('keyup', (e)=>{

        if(e.code==='KeyW') moveState.fwd=false; if(e.code==='KeyS') moveState.bwd=false;

        if(e.code==='KeyA') moveState.lft=false; if(e.code==='KeyD') moveState.rgt=false;

        if(e.code==='ShiftLeft' || e.code==='ShiftRight') moveState.shift=false;

        if(e.code==='KeyQ') leanState.left=false;

        if(e.code==='KeyE') leanState.right=false;

      });

    }



    // --- [7. 메인 게임 루프] ---

    const clock = new THREE.Clock(); 

    let flightTime = 0; let bobbingTime = 0; let bobIntensity = 0;



    function animate() {

      requestAnimationFrame(animate);

      let delta = clock.getDelta(); if(delta > 0.1) delta = 0.1; 



      updatePlaneSeatsUI(); 

      

      // 수송기 프로펠러 회전 및 야간 항법등 점멸 효과

      if (planePropellers && planePropellers.length > 0) {

        planePropellers.forEach(p => { p.rotation.z += 25 * delta; });

      }

      if (planeNavLights && planeNavLights.length > 0) {

        const flash = Math.floor(clock.getElapsedTime() * 4) % 2 === 0;

        planeNavLights.forEach((light, idx) => {

          if (idx === 2) {

            light.visible = Math.floor(clock.getElapsedTime() * 8) % 2 === 0;

          } else {

            light.visible = flash;

          }

        });

      } 

      

      // 경사지에서 다리와 발이 묻히는 것을 방지하기 위해 경사도(Slope)에 비례한 부상(Slope Lift) 오프셋 계산 헬퍼

      const getSlopeLift = (x, z) => {

        const eps = 0.5;

        const hL = getElevation(x - eps, z, false);

        const hR = getElevation(x + eps, z, false);

        const hD = getElevation(x, z - eps, false);

        const hU = getElevation(x, z + eps, false);

        const slope = Math.sqrt((hR - hL)*(hR - hL) + (hU - hD)*(hU - hD)) / (2 * eps);

        return slope > 0.15 ? (slope - 0.15) * 0.38 : 0;

      }; 

      

      if (gameState === 'LOBBY') {

        const lobbyY = getElevation(0, 0, 0);

        playerPos.set(0, lobbyY, 0);

        myPlayerGroup.position.copy(playerPos);

        myPlayerGroup.rotation.set(0, 0, 0);

        

        // 카메라 인터랙티브 및 천천히 공전 연출 (드래그하지 않을 때 자동 공전)

        if (!isLobbyDragging) {

          lobbyAngle += delta * 0.15;

        }

        const horizontalDist = lobbyDistance * Math.cos(lobbyPitch);

        const verticalDist = lobbyDistance * Math.sin(lobbyPitch);

        camera.position.set(

          playerPos.x + Math.cos(lobbyAngle) * horizontalDist,

          playerPos.y + 1.1 + verticalDist,

          playerPos.z + Math.sin(lobbyAngle) * horizontalDist

        );

        

        // 지형 고도(Elevation)를 실시간 계산하여 지면 밑으로 파고들지 못하도록 제한

        const camGndY = getElevation(camera.position.x, camera.position.z, false);

        if (camera.position.y < camGndY + 0.3) {

          camera.position.y = camGndY + 0.3;

        }

        

        camera.lookAt(playerPos.x, playerPos.y + 0.95, playerPos.z);

        

        // 로비 대기 자세 (총구를 대각선 아래로 편안하게 내리는 Low-Ready 자세 연출 - 겹침 방지)

        playerSoldier.rightArm.rotation.set(0.5, -0.15, 0.05);

        playerSoldier.rightElbow.rotation.set(0.6, 0.08, 0);

        playerSoldier.leftArm.rotation.set(0.35, 0.25, 0.05);

        playerSoldier.leftElbow.rotation.set(0.65, -0.1, 0);

        playerSoldier.leftThigh.rotation.set(0, 0, 0);

        playerSoldier.rightThigh.rotation.set(0, 0, 0);

        playerSoldier.leftKnee.rotation.set(0, 0, 0);

        playerSoldier.rightKnee.rotation.set(0, 0, 0);

        

        renderer.render(scene, camera);

        return;

      }

      

      // 승리 또는 패배 시 슬로우 모션 처리

      if (hasWonMatch) {

        if (victoryTimer > 0) {

          delta *= 0.2; // 5배 느리게

          victoryTimer -= (clock.getDelta() || 0.016); // 실제 시간 기준으로 타이머 차감

          if (victoryTimer <= 0) {

            showVictoryUI();

          }

        }

        

        // 치킨 낙하 업데이트 (지형지물 충돌 반사 및 퉁퉁 튕기는 바운스 물리 연출 구현)

        if (victoryChicken) {

          const timeStep = (victoryTimer > 0) ? (delta / 0.2) : delta;

          if (!victoryChicken.landed) {

            // 중력 가속도 및 마찰 저항 보정

            victoryChicken.velY -= 45 * timeStep;

            if (victoryChicken.bounces > 0) {

              victoryChicken.velX *= Math.exp(-2.0 * timeStep);

              victoryChicken.velZ *= Math.exp(-2.0 * timeStep);

            }

            

            // 위치 업데이트

            victoryChicken.group.position.y += victoryChicken.velY * timeStep;

            victoryChicken.group.position.x += victoryChicken.velX * timeStep;

            victoryChicken.group.position.z += victoryChicken.velZ * timeStep;

            

            // 공중 회전

            if (victoryChicken.bounces < 3) {

              victoryChicken.group.rotation.x += timeStep * 8;

              victoryChicken.group.rotation.y += timeStep * 6;

            }

            

            // 지형지물(나무, 바위, 건물) 충돌 감지 및 튕김

            const chickenRadius = 1.9;

            obstacles.forEach(obs => {

              if (obs.type === 'TREE' || obs.type === 'ROCK') {

                const dx = victoryChicken.group.position.x - obs.x;

                const dz = victoryChicken.group.position.z - obs.z;

                const dist = Math.sqrt(dx * dx + dz * dz);

                const minDist = obs.radius + chickenRadius;

                if (dist < minDist && Math.abs(victoryChicken.group.position.y - obs.spotY) < 6.0) {

                  // 수평으로 튕기기

                  const pushX = (dx / (dist || 1)) * 12;

                  const pushZ = (dz / (dist || 1)) * 12;

                  victoryChicken.velX = pushX;

                  victoryChicken.velZ = pushZ;

                  victoryChicken.velY = Math.max(8, -victoryChicken.velY * 0.35); // 위쪽 반발

                  SoundSystem.playPunch(false);

                }

              } else if (obs.type === 'BUILDING') {

                obs.walls.forEach(w => {

                  const cx = Math.max(w.minX, Math.min(victoryChicken.group.position.x, w.maxX));

                  const cz = Math.max(w.minZ, Math.min(victoryChicken.group.position.z, w.maxZ));

                  const dx = victoryChicken.group.position.x - cx;

                  const dz = victoryChicken.group.position.z - cz;

                  const dist = Math.sqrt(dx * dx + dz * dz);

                  if (dist < chickenRadius && Math.abs(victoryChicken.group.position.y - obs.spotY) < 6.0) {

                    // 건물 벽면 튕김

                    const pushX = (dx / (dist || 1)) * 14;

                    const pushZ = (dz / (dist || 1)) * 14;

                    victoryChicken.velX = pushX;

                    victoryChicken.velZ = pushZ;

                    victoryChicken.velY = Math.max(8, -victoryChicken.velY * 0.35);

                    SoundSystem.playPunch(false);

                  }

                });

              }

            });

            

            // 지면 및 옥상 착지/바운스 검사

            const currentGroundY = getElevation(victoryChicken.group.position.x, victoryChicken.group.position.z, victoryChicken.group.position.y);

            const limitY = currentGroundY + 4.2; // 3.5배 스케일업 닭의 안착 고도 오프셋

            if (victoryChicken.group.position.y <= limitY) {

              victoryChicken.group.position.y = limitY;

              

              if (victoryChicken.bounces < 3) {

                victoryChicken.velY = -victoryChicken.velY * 0.45; // 45% 반발 탄성 계수

                victoryChicken.velX = (Math.random() - 0.5) * 14; // 불규칙 수평 비산

                victoryChicken.velZ = (Math.random() - 0.5) * 14;

                victoryChicken.bounces++;

                

                createShockwave(victoryChicken.group.position.clone());

                SoundSystem.playPunch(false); // 바운스 충격음

              } else {

                victoryChicken.landed = true;

                victoryChicken.group.rotation.set(0, 0, 0); // 똑바로 서기

                createShockwave(victoryChicken.group.position.clone());

                SoundSystem.playPunch(false);

              }

            }

          } else {

            // 땅에 착지한 상태에서의 수평 미끄러짐 마찰 저항 보정

            victoryChicken.velX *= Math.exp(-4.0 * timeStep);

            victoryChicken.velZ *= Math.exp(-4.0 * timeStep);

            

            victoryChicken.group.position.x += victoryChicken.velX * timeStep;

            victoryChicken.group.position.z += victoryChicken.velZ * timeStep;

            

            // 건물/장애물 충돌 밀려남 처리

            const chickenRadius = 1.9;

            obstacles.forEach(obs => {

              if (obs.type === 'TREE' || obs.type === 'ROCK') {

                const dx = victoryChicken.group.position.x - obs.x;

                const dz = victoryChicken.group.position.z - obs.z;

                const dist = Math.sqrt(dx * dx + dz * dz);

                const minDist = obs.radius + chickenRadius;

                if (dist < minDist) {

                  const push = minDist - dist;

                  victoryChicken.group.position.x += (dx / (dist || 1)) * push;

                  victoryChicken.group.position.z += (dz / (dist || 1)) * push;

                  victoryChicken.velX = 0; victoryChicken.velZ = 0;

                }

              }

            });

            

            const currentGroundY = getElevation(victoryChicken.group.position.x, victoryChicken.group.position.z, victoryChicken.group.position.y);

            victoryChicken.group.position.y = currentGroundY + 4.2;

          }

        }



        // 살아있는 닭 업데이트 (AI 배회 및 피격 시 날개 파다닥 파닉스 도망 구현)

        liveChickens.forEach(c => {

          c.wanderTime -= delta;

          

          const speedMultiplier = c.panicTime > 0 ? 25 : 6;

          c.animationTime += delta * speedMultiplier;

          

          const wingL = c.mesh.getObjectByName('wingL');

          const wingR = c.mesh.getObjectByName('wingR');

          const head = c.mesh.getObjectByName('head');

          const legL = c.mesh.getObjectByName('legL');

          const legR = c.mesh.getObjectByName('legR');

          

          if (c.panicTime > 0) {

            c.panicTime -= delta;

            c.speed = 4.8; // 파닉스 도망 속도 증가

            

            // 날개를 양옆 및 위아래로 힘차게 펄럭임

            if (wingL) { wingL.rotation.z = 0.4 + Math.sin(c.animationTime) * 0.9; wingL.rotation.x = 0.2 + Math.cos(c.animationTime) * 0.3; }

            if (wingR) { wingR.rotation.z = -0.4 - Math.sin(c.animationTime) * 0.9; wingR.rotation.x = -0.2 - Math.cos(c.animationTime) * 0.3; }

            if (head) { head.rotation.z = Math.sin(c.animationTime * 1.5) * 0.45; head.rotation.x = Math.cos(c.animationTime) * 0.2; }

          } else {

            c.speed = 0.8; // 일반 배회 속도

            if (wingL) { wingL.rotation.z = Math.sin(c.animationTime * 0.5) * 0.1; wingL.rotation.x = Math.PI / 12; }

            if (wingR) { wingR.rotation.z = -Math.sin(c.animationTime * 0.5) * 0.1; wingR.rotation.x = -Math.PI / 12; }

            if (head) { head.rotation.set(0, 0, 0); }

          }

          

          // 이동 중일 때 다리가 교차하며 움직이는 애니메이션

          if (legL && legR) {

            const legSwing = Math.sin(c.animationTime) * (c.panicTime > 0 ? 0.7 : 0.35);

            legL.rotation.z = legSwing;

            legR.rotation.z = -legSwing;

          }

          

          if (c.wanderTime <= 0) {

            c.wanderTime = Math.random() * 3 + 2; // 2~5초마다 랜덤 방향 전환

            c.dir.set((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();

          }

          

          // 충돌 회피 (닭이 엄폐물 뚫고 들어가는 것 방지)

          resolveCollisions(c.pos, 0.4);

          

          // 위치 업데이트

          const moveStep = c.dir.clone().multiplyScalar(c.speed * delta);

          c.pos.add(moveStep);

          c.mesh.position.copy(c.pos);

          

          // 피격 깜짝 놀람 시 통통 위아래로 튀어오르는(Hop) 물리 추가

          const hop = c.panicTime > 0 ? Math.abs(Math.sin(c.animationTime * 0.8)) * 0.28 : 0;

          c.mesh.position.y = getElevation(c.pos.x, c.pos.z) + hop;

          

          // 방향 갱신 (머리 방향인 X축이 정확히 이동 방향 c.dir을 가리키도록 -Math.PI / 2 보정 적용)

          const angle = Math.atan2(c.dir.x, c.dir.z);

          c.mesh.rotation.y = angle - Math.PI / 2;

          

          // 걷기 상하 바운싱 애니메이션

          const bob = Math.sin(c.animationTime) * 0.03;

          c.mesh.children[0].position.y = 0.4 + bob;

        });

      } else if (gameState === 'DEFEAT' || gameState === 'REVIVE_SLOT') {

        // Enforce visibility of player body, head, and equipment during the defeat animation

        myPlayerGroup.visible = true;

        playerSoldier.headGroup.visible = true;

        if (playerSoldier.body) playerSoldier.body.visible = true;

        if (playerSoldier.backpackGroup) playerSoldier.backpackGroup.visible = true;



        // Reset arms to default shoulder joint coordinates to prevent them from floating away from the torso

        playerSoldier.rightArm.position.set(0.38, 1.25, 0);

        playerSoldier.leftArm.position.set(-0.38, 1.25, 0);

        playerSoldier.rightArm.rotation.set(0.2, 0, 0.2);

        playerSoldier.leftArm.rotation.set(0.2, 0, -0.2);

        playerSoldier.rightElbow.rotation.set(0.3, 0, 0);

        playerSoldier.leftElbow.rotation.set(0.3, 0, 0);

        updateSoldierJoints(playerSoldier); // 어깨 관절 구체(joints)도 몸통에 확실히 밀착시킴



        if (gameState === 'DEFEAT') {

          delta *= 0.2; // 5배 느리게

          defeatTimer -= (clock.getDelta() || 0.016); // 실제 시간 기준으로 타이머 차감

        }

        

        const progress = Math.min(1.0, (3.0 - Math.max(0, defeatTimer)) / 3.0);

        

        // 캐릭터 쓰러지는 애니메이션 (극적 공중제비/스핀 및 높이 보정)

        myPlayerGroup.rotation.x = progress * Math.PI * 1.5;

        myPlayerGroup.rotation.y = progress * Math.PI * 2.0;

        myPlayerGroup.rotation.z = progress * Math.PI * 0.5;

        

        // 지면에 떨어지며 퉁퉁 튕기는 감쇠 바운스 물리 연출

        const bounceFactor = Math.abs(Math.sin(progress * Math.PI * 2.5)) * 0.85 * (1.0 - progress);

        myPlayerGroup.position.copy(playerPos);

        

        // 캐릭터 두께 및 어깨 폭을 고려하여 최종 눕는 높이를 최소 0.48로 설정해 땅 파묻힘 현상 제거

        myPlayerGroup.position.y = getElevation(playerPos.x, playerPos.z, playerPos.y) + Math.max(0.48, 0.95 * (1.0 - progress)) + bounceFactor;

        

        // 카메라가 캐릭터 주변을 공전하는 시네마틱 롤링 효과

        const angle = progress * Math.PI * 1.5; // 270도 공전

        const orbitRadius = 5.0;

        camera.position.set(

          playerPos.x + Math.cos(angle) * orbitRadius,

          playerPos.y + 1.8 + Math.sin(progress * Math.PI) * 1.0,

          playerPos.z + Math.sin(angle) * orbitRadius

        );

        camera.lookAt(playerPos.x, playerPos.y + 0.3, playerPos.z);

        

        if (gameState === 'DEFEAT' && defeatTimer <= 0) {

          if (!hasRevived) {

            gameState = 'REVIVE_SLOT';

            startReviveSlotMachine();

          } else {

            showDefeatUI();

            gameState = 'FINISHED'; // 중복 실행 방지

          }

        }

      }

      

      // 스코프 장착 시 FOV 동적 조절

      const targetFov = isZooming ? (65 / currentScope.mag) : 65; 

      if (Math.abs(camera.fov - targetFov) > 0.5) { camera.fov += (targetFov - camera.fov) * 15 * delta; camera.updateProjectionMatrix(); }



      // 바닥 아이템 공전/부유 연출 (무기와 탄창 등이 회전하면서 겹치는 일을 막기 위해 회전은 삭제하고 미세 부유 운동만 적용)

      const elapsed = clock.getElapsedTime();

      lootBoxes.forEach(loot => {

        if (!loot.isCrate) {

          loot.mesh.position.y = getElevation(loot.mesh.position.x, loot.mesh.position.z, loot.mesh.position.y) + 0.8 + Math.sin(elapsed * 3) * 0.15;

        }

      });



      if (gameState !== 'LOBBY') {

        if (planeGroup.position.z < 1200) {

          planeGroup.position.add(new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(40 * delta)); 

          flightTime += delta;

        } else if (planeGroup.visible) {

          planeGroup.visible = false;

        }

      }



      if(gameState === 'AIRPLANE') {

        playerPos.copy(planeGroup.position);

        const offset = new THREE.Vector3(0, 15, 50);

        offset.applyQuaternion(camera.quaternion);

        camera.position.copy(planeGroup.position).add(offset);

        

        // Force jump if the plane goes beyond the island (z >= 250)

        if (planeGroup.position.z >= 250) {

          gameState = 'FALLING';

          updatePlayerHp(-50, null);

          actionBtn.innerText = isTouchDevice ? '🪂 낙하산 펴기' : '🪂 낙하산 펴기 (좌클릭/F)';

          showNotice("⚠️ 섬을 벗어나 강제 낙하합니다! (HP 50% 감소)", 4000);

          SoundSystem.stopPlaneSound();

        }

      } else if (gameState === 'FALLING') {

        myPlayerGroup.visible = true; 

        playerPos.y -= 20 * delta; 

        

        let fwd = moveState.jY; let rgt = moveState.jX;

        if(!isTouchDevice) { fwd = (moveState.fwd?1:0) - (moveState.bwd?1:0); rgt = (moveState.rgt?1:0) - (moveState.lft?1:0); }

        

        const forward = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); forward.y=0; forward.normalize();

        const rDir = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

        

        let horizontalSpeed = 22.0;

        if (fwd !== 0 || rgt !== 0) {

          playerPos.add(forward.multiplyScalar(fwd * horizontalSpeed * delta));

          playerPos.add(rDir.multiplyScalar(rgt * horizontalSpeed * delta));

        } else {

          playerPos.add(forward.multiplyScalar(8 * delta));

        }

        

        myPlayerGroup.position.copy(playerPos);

        myPlayerGroup.rotation.y = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

        myPlayerGroup.rotation.x = -Math.PI * 0.45; // 머리가 바닥을 향하고 배가 바닥을 보도록 수직 회전 보정

        

        // Full TPP camera pitch orbit to keep player centered

        const offset = new THREE.Vector3(0, 3.5, 10);

        offset.applyQuaternion(camera.quaternion);

        camera.position.copy(playerPos).add(offset);

        

        updateSkydivePose(playerSoldier, fwd, rgt, false);

        

        if(playerPos.y <= getElevation(playerPos.x, playerPos.z, playerPos.y) + 30) { gameState = 'PARACHUTING'; parachute.visible = true; actionBtn.style.display = 'none'; SoundSystem.playParachuteSound(); }

      } else if (gameState === 'PARACHUTING') {

        playerPos.y -= 7 * delta; 

        

        let fwd = moveState.jY; let rgt = moveState.jX;

        if(!isTouchDevice) { fwd = (moveState.fwd?1:0) - (moveState.bwd?1:0); rgt = (moveState.rgt?1:0) - (moveState.lft?1:0); }

        

        const forward = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); forward.y=0; forward.normalize();

        const rDir = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

        

        let horizontalSpeed = 14.0;

        if (fwd !== 0 || rgt !== 0) {

          playerPos.add(forward.multiplyScalar(fwd * horizontalSpeed * delta));

          playerPos.add(rDir.multiplyScalar(rgt * horizontalSpeed * delta));

        } else {

          playerPos.add(forward.multiplyScalar(5 * delta));

        }

        

        myPlayerGroup.position.copy(playerPos);

        myPlayerGroup.rotation.y = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

        

        // 낙하산 전개 시 대롱대롱 흔들리는 펜듈럼 진동 효과 (Deceleration Snap 및 물리 흔들림 재현)

        const swingX = Math.sin(clock.getElapsedTime() * 4.2) * 0.14;

        const swingZ = Math.cos(clock.getElapsedTime() * 3.2) * 0.08;

        myPlayerGroup.rotation.x = swingX;

        myPlayerGroup.rotation.z = swingZ;

        

        parachute.rotation.set(0, 0, 0); // 부모 진동에 100% 동조하여 끈 탈착 방지

        

        // Full TPP camera pitch orbit to keep player centered

        const offset = new THREE.Vector3(0, 3.5, 10);

        offset.applyQuaternion(camera.quaternion);

        camera.position.copy(playerPos).add(offset);

        

        updateSkydivePose(playerSoldier, fwd, rgt, true);

        

        const groundY = getElevation(playerPos.x, playerPos.z, playerPos.y);

        if(playerPos.y <= groundY) {

          playerPos.y = groundY; gameState = 'PLAYING'; parachute.visible = false; SoundSystem.stopSkydiveWindSound();

          myPlayerGroup.rotation.x = 0;

          myPlayerGroup.rotation.z = 0;

          playerSoldier.parachuteBag.visible = false;

          playerSoldier.updateBagVisual(playerInventory.bag);

          if(isTouchDevice) { document.getElementById('btn-attack').style.display='flex'; document.getElementById('player-hp-ui').style.display='block'; }

          showNotice("지상에 도착했습니다. 파밍을 시작하세요!", 3000);

          document.getElementById('throw-shortcuts').style.display = 'flex';

        }

      } else if (gameState === 'PLAYING' && playerHp > 0) {

        if (playerInvincibleTime > 0) {

          playerInvincibleTime -= delta;

          document.getElementById('player-hp-text').innerText = 'HP: ' + Math.ceil(playerHp) + ' (무적 ' + playerInvincibleTime.toFixed(1) + 's)';

          document.getElementById('player-hp-text').style.color = '#ffeb3b';

        } else {

          document.getElementById('player-hp-text').innerText = 'HP: ' + Math.ceil(playerHp);

          document.getElementById('player-hp-text').style.color = '';

        }

        let bobY = 0;

        if (isVaulting) {

          // 1. 파쿠르 중일 때의 포물선 이동 보간

          const t = (clock.getElapsedTime() - vaultStartTime) / VAULT_DURATION;

          if (t >= 1.0) {

            isVaulting = false;

            playerPos.copy(vaultEndPos);

            playerPos.y = getElevation(playerPos.x, playerPos.z, playerPos.y);

          } else {

            playerPos.lerpVectors(vaultStartPos, vaultEndPos, t);

            playerPos.y += Math.sin(t * Math.PI) * 1.5; // 포물선 점프 곡선

          }

          myPlayerGroup.position.copy(playerPos);

          myPlayerGroup.rotation.y = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

          

          // 파쿠르 넘기 중 팔다리 넘어가기 애니메이션

          playerSoldier.leftArm.rotation.set(-2.0, 0.2, -0.4);

          playerSoldier.rightArm.rotation.set(-2.0, -0.2, 0.4);

          playerSoldier.leftThigh.rotation.set(-0.8, 0, 0);

          playerSoldier.rightThigh.rotation.set(-0.3, 0, 0);

          playerSoldier.leftKnee.rotation.set(1.2, 0, 0);

          playerSoldier.rightKnee.rotation.set(0.6, 0, 0);

        } else {

          // 2. 정상 플레이 및 이동 처리

          let fwd = moveState.jY; let rgt = moveState.jX;

          if(!isTouchDevice) { fwd = (moveState.fwd?1:0) - (moveState.bwd?1:0); rgt = (moveState.rgt?1:0) - (moveState.lft?1:0); }

          

          let isMoving = (fwd !== 0 || rgt !== 0);

          if (isMoving) {
            const now = clock.getElapsedTime();
            const stepDelay = moveState.shift ? 0.30 : 0.44;
            if (now - lastFootstepTime >= stepDelay) {
              SoundSystem.playFootstep(moveState.shift);
              lastFootstepTime = now;
            }

            if (isHealing) {

              isHealing = false;

              document.getElementById('heal-progress-container').style.display = 'none';

              showNotice("⚠️ 움직임으로 인해 구급상자 사용이 취소되었습니다.");

            }

          }

          bobIntensity += (isMoving ? 1 : -1) * delta * 5; bobIntensity = Math.max(0, Math.min(1, bobIntensity));

          const bobRate = isZooming ? 7 : (moveState.shift ? 22 : 15);

          bobbingTime += delta * bobRate;

          bobY = Math.sin(bobbingTime) * 0.05 * bobIntensity;



          const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); dir.y=0; dir.normalize();

          const rDir = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).normalize();

          

          const groundY = getElevation(playerPos.x, playerPos.z, playerPos.y);

          const waterY = getWaterLevel(playerPos.x, playerPos.z);

          const isSwimming = (waterY - getElevation(playerPos.x, playerPos.z, false) >= 0.55);

          

          // 자세별 이동속도 차등

          let stanceSpeed = 1.0;

          if (isSwimming) stanceSpeed = 0.3; // 수영 시 70% 감속

          else if (playerStance === 'CROUCH') stanceSpeed = 0.55;

          else if (playerStance === 'PRONE') stanceSpeed = 0.22;

          

          const sprintSpeed = (moveState.shift && playerStance === 'STAND' && !isZooming && !isSwimming) ? 8.5 : 5.5;

          const currentSpeed = isZooming ? 2.2 : sprintSpeed * stanceSpeed;



          playerPos.add(dir.multiplyScalar(fwd * currentSpeed * delta));

          playerPos.add(rDir.multiplyScalar(rgt * currentSpeed * delta));

          

          resolveCollisions(playerPos, 0.55, 'PLAYER');

          

          // 3. 점프 중력 물리 엔진

          if (!isGrounded) {

            playerVelocityY -= 9.8 * 2.2 * delta; 

            playerPos.y += playerVelocityY * delta;

            

            const gY = getElevation(playerPos.x, playerPos.z, playerPos.y);

            const hasWater = (getElevation(playerPos.x, playerPos.z, false) < waterY);

            

            if (hasWater && playerPos.y <= waterY - 0.55) {

              playerPos.y = waterY - 0.55;

              playerVelocityY = 0;

              isGrounded = true;

            } else if (playerPos.y <= gY) {

              playerPos.y = gY;

              playerVelocityY = 0;

              isGrounded = true;

            }

          } else {

            const freshGroundY = getElevation(playerPos.x, playerPos.z, playerPos.y);

            playerPos.y = isSwimming ? (waterY - 0.55) : freshGroundY;

            // 사격 중이 아닐 때는 반동 탄퍼짐 회복
            if (playerSpreadAccum > 0) {
              playerSpreadAccum = Math.max(0, playerSpreadAccum - delta * 0.38);
            }

            if (isLeftMouseDown && !isReloading && playerHp > 0) {
              const canAutoFire = (currentWeapon === WEAPONS.RIFLE || currentWeapon === WEAPONS.PISTOL);
              if (canAutoFire) {
                const fireInterval = (currentWeapon === WEAPONS.RIFLE) ? 0.11 : 0.25;
                if (clock.getElapsedTime() - lastPlayerShotTime >= fireInterval) {
                  performPlayerAttack();
                }
              }
            }

          }



          // 자동 연발 사격 처리 (돌격소총: 0.11초, 권총: 0.25초 간격)

          if (isLeftMouseDown && !isReloading && playerHp > 0) {

            const canAutoFire = (currentWeapon === WEAPONS.RIFLE || currentWeapon === WEAPONS.PISTOL);

            if (canAutoFire) {

              const fireInterval = (currentWeapon === WEAPONS.RIFLE) ? 0.11 : 0.25;

              if (clock.getElapsedTime() - lastPlayerShotTime >= fireInterval) {

                performPlayerAttack();

              }

            }

          }



          // 구급상자 사용 진행 타이머

          if (isHealing) {

            healTimer += delta;

            const pct = Math.min(100, (healTimer / HEAL_DURATION) * 100);

            const fillBar = document.getElementById('heal-progress-bar');

            if (fillBar) fillBar.style.width = pct + '%';

            

            if (healTimer >= HEAL_DURATION) {

              isHealing = false;

              const container = document.getElementById('heal-progress-container');

              if (container) container.style.display = 'none';

              

              playerInventory.firstaids--;

              playerHp = 75;

              updatePlayerHp(0);

              SoundSystem.playHealSound();

              showNotice("💊 구급상자 사용 완료! (체력 75% 회복)");

              updateInventoryUI();

            }

          }



          // 4. 캐릭터 자세별 골격 기하학 및 걷기/포복 애니메이션

          if (isHealing) {

            // 쪼그려 앉아서 힐링하는 뼈대 자세

            playerSoldier.body.rotation.x = 0;

            playerSoldier.body.position.set(0, 0.55, 0);

            playerSoldier.headGroup.position.set(0, 1.05, 0);

            playerSoldier.headGroup.rotation.x = 0;

            playerSoldier.leftArm.position.set(-0.38, 0.85, 0);

            playerSoldier.rightArm.position.set(0.38, 0.85, 0);

            playerSoldier.leftLeg.position.set(-0.16, 0.3, 0);

            playerSoldier.rightLeg.position.set(0.16, 0.3, 0);



            playerSoldier.leftThigh.rotation.x = -1.0;

            playerSoldier.rightThigh.rotation.x = -1.0;

            playerSoldier.leftKnee.rotation.x = 1.8;

            playerSoldier.rightKnee.rotation.x = 1.8;



            playerSoldier.leftArm.rotation.set(-0.5, 0.4, 0);

            playerSoldier.rightArm.rotation.set(-0.5, -0.4, 0);

            

            if(playerSoldier.backpackGroup) {

              playerSoldier.backpackGroup.position.set(0, 0.55, 0.16);

              playerSoldier.backpackGroup.rotation.x = 0;

            }

            if(playerSoldier.parachuteBag) {

              playerSoldier.parachuteBag.position.set(0, 0.55, 0.16);

              playerSoldier.parachuteBag.rotation.x = 0;

            }

          } else {

            const isSwimming = (getWaterLevel(playerPos.x, playerPos.z) - getElevation(playerPos.x, playerPos.z, false) >= 0.55);

            if (isSwimming) {

              // 수영 상태 뼈대 및 모션 (엎드려서 수영하는 수평 자세)

              playerSoldier.body.rotation.x = Math.PI / 2.2; 

              playerSoldier.body.position.set(0, 0.25, 0);

              playerSoldier.headGroup.position.set(0, 0.35, -0.4);

              playerSoldier.headGroup.rotation.x = -Math.PI / 4; // 머리를 들어 정면 주시

              playerSoldier.leftArm.position.set(-0.35, 0.3, -0.2);

              playerSoldier.rightArm.position.set(0.35, 0.3, -0.2);

              playerSoldier.leftLeg.position.set(-0.16, 0.25, 0.3);

              playerSoldier.rightLeg.position.set(0.16, 0.25, 0.3);



              if(playerSoldier.backpackGroup) {

                playerSoldier.backpackGroup.position.set(0, 0.25, 0.16);

                playerSoldier.backpackGroup.rotation.x = Math.PI / 2.2;

              }

              if(playerSoldier.parachuteBag) {

                playerSoldier.parachuteBag.position.set(0, 0.25, 0.16);

                playerSoldier.parachuteBag.rotation.x = Math.PI / 2.2;

              }



              const swimCycle = Math.sin(bobbingTime * 0.4);

              playerSoldier.leftArm.rotation.set(Math.PI / 2 + swimCycle * 0.9, 0.4, -0.2);

              playerSoldier.rightArm.rotation.set(Math.PI / 2 - swimCycle * 0.9, -0.4, 0.2);

              playerSoldier.leftThigh.rotation.set(-Math.PI / 2.2 + swimCycle * 0.4, 0, 0.1);

              playerSoldier.rightThigh.rotation.set(-Math.PI / 2.2 - swimCycle * 0.4, 0, -0.1);

              const leftKneeAngle = 0.3 + Math.sin(bobbingTime * 0.4 - Math.PI / 2) * 0.25;

              const rightKneeAngle = 0.3 + Math.sin(bobbingTime * 0.4 + Math.PI / 2) * 0.25;

              playerSoldier.leftKnee.rotation.set(leftKneeAngle, 0, 0);

              playerSoldier.rightKnee.rotation.set(rightKneeAngle, 0, 0);

            } else if (playerStance === 'PRONE') {

              playerSoldier.body.rotation.x = Math.PI / 2;

              playerSoldier.body.position.set(0, 0.15, 0);

              playerSoldier.headGroup.position.set(0, 0.15, -0.45);

              playerSoldier.headGroup.rotation.x = 0; 

              playerSoldier.leftArm.position.set(-0.35, 0.15, -0.2);

              playerSoldier.rightArm.position.set(0.35, 0.15, -0.2);

              playerSoldier.leftLeg.position.set(-0.16, 0.15, 0.3);

              playerSoldier.rightLeg.position.set(0.16, 0.15, 0.3);



              if(playerSoldier.backpackGroup) {

                playerSoldier.backpackGroup.position.set(0, 0.15, 0.16);

                playerSoldier.backpackGroup.rotation.x = Math.PI / 2;

              }

              if(playerSoldier.parachuteBag) {

                playerSoldier.parachuteBag.position.set(0, 0.15, 0.16);

                playerSoldier.parachuteBag.rotation.x = Math.PI / 2;

              }



              const wiggle = Math.sin(bobbingTime * 0.8) * 0.15 * bobIntensity;

              playerSoldier.body.rotation.y = wiggle;

              

              playerSoldier.leftThigh.rotation.set(-Math.PI/2 + 0.2, 0, 0.1);

              playerSoldier.rightThigh.rotation.set(-Math.PI/2 + 0.2, 0, -0.1);

              playerSoldier.leftKnee.rotation.set(0, 0, 0);

              playerSoldier.rightKnee.rotation.set(0, 0, 0);



              playerSoldier.leftArm.rotation.set(Math.PI/2 - Math.sin(bobbingTime)*0.4 * bobIntensity, 0.2, -0.1);

              playerSoldier.rightArm.rotation.set(Math.PI/2 + Math.sin(bobbingTime)*0.4 * bobIntensity, -0.2, 0.1);

            } else if (playerStance === 'CROUCH') {

              playerSoldier.body.rotation.x = 0;

              playerSoldier.body.position.set(0, 0.55, 0);

              playerSoldier.headGroup.position.set(0, 1.05, 0);

              playerSoldier.headGroup.rotation.x = 0;

              playerSoldier.leftArm.position.set(-0.38, 0.85, 0);

              playerSoldier.rightArm.position.set(0.38, 0.85, 0);

              playerSoldier.leftLeg.position.set(-0.16, 0.3, 0);

              playerSoldier.rightLeg.position.set(0.16, 0.3, 0);



              if(playerSoldier.backpackGroup) {

                playerSoldier.backpackGroup.position.set(0, 0.55, 0.16);

                playerSoldier.backpackGroup.rotation.x = 0;

              }

              if(playerSoldier.parachuteBag) {

                playerSoldier.parachuteBag.position.set(0, 0.55, 0.16);

                playerSoldier.parachuteBag.rotation.x = 0;

              }



              playerSoldier.leftThigh.rotation.x = 1.0;

              playerSoldier.rightThigh.rotation.x = 1.0;

              playerSoldier.leftKnee.rotation.x = -1.5;

              playerSoldier.rightKnee.rotation.x = -1.5;



              const swing = Math.sin(bobbingTime) * 0.35 * bobIntensity;

              playerSoldier.leftThigh.rotation.x += swing;

              playerSoldier.rightThigh.rotation.x -= swing;



              if (currentWeapon !== WEAPONS.PUNCH) {

                const camEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);

                playerSoldier.rightArm.rotation.x = Math.PI / 2 + camEuler.x;

                

                // --- [두 손 파지법 적용 (앉기)] ---

                if (currentWeapon.name === '권총') {

                  playerSoldier.leftArm.rotation.x = Math.PI / 2 + camEuler.x;

                  playerSoldier.leftArm.rotation.y = 0.4;

                  playerSoldier.leftArm.position.set(-0.25, 0.85, -0.1);

                } else {

                  playerSoldier.leftArm.rotation.x = 1.1 + camEuler.x * 0.5;

                  playerSoldier.leftArm.rotation.y = -0.4;

                  playerSoldier.leftArm.position.set(-0.35, 0.8, -0.2);

                }

              } else {

                playerSoldier.leftArm.rotation.x = swing * 0.6;

                playerSoldier.rightArm.rotation.x = -swing * 0.6;

                playerSoldier.leftArm.rotation.y = 0;

                playerSoldier.rightArm.rotation.y = 0;

              }

            } else {

              playerSoldier.body.rotation.x = 0;

              playerSoldier.body.position.set(0, 0.95, 0);

              playerSoldier.headGroup.position.set(0, 1.45, 0);

              playerSoldier.headGroup.rotation.x = 0;

              playerSoldier.leftArm.position.set(-0.38, 1.25, 0);

              playerSoldier.rightArm.position.set(0.38, 1.25, 0);

              playerSoldier.leftLeg.position.set(-0.16, 0.6, 0);

              playerSoldier.rightLeg.position.set(0.16, 0.6, 0);



              if(playerSoldier.backpackGroup) {

                playerSoldier.backpackGroup.position.set(0, 0.95, 0.16);

                playerSoldier.backpackGroup.rotation.x = 0;

              }

              if(playerSoldier.parachuteBag) {

                playerSoldier.parachuteBag.position.set(0, 0.95, 0.16);

                playerSoldier.parachuteBag.rotation.x = 0;

              }



              const swing = Math.sin(bobbingTime) * 0.6 * bobIntensity;

              playerSoldier.leftThigh.rotation.x = -swing;

              playerSoldier.rightThigh.rotation.x = swing;

              playerSoldier.leftKnee.rotation.x = swing > 0 ? -swing * 1.2 : 0;

              playerSoldier.rightKnee.rotation.x = swing < 0 ? swing * 1.2 : 0;



              if (playerRecoilTime > 0) playerRecoilTime -= delta;

              const recoilOffset = playerRecoilTime > 0 ? 0.3 : 0;



              if (playerPunchTime > 0) {

                playerPunchTime -= delta;

                const camEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);

                if (punchSide === 'LEFT') {

                  playerSoldier.leftArm.rotation.x = Math.PI / 2 + 0.5 + camEuler.x;

                  playerSoldier.rightArm.rotation.x = 0;

                } else {

                  playerSoldier.rightArm.rotation.x = Math.PI / 2 + 0.5 + camEuler.x;

                  playerSoldier.leftArm.rotation.x = 0;

                }

                playerSoldier.leftArm.rotation.y = 0;

                playerSoldier.rightArm.rotation.y = 0;

              } else if (currentWeapon !== WEAPONS.PUNCH) {

                const camEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);

                playerSoldier.rightArm.rotation.x = Math.PI / 2 + camEuler.x + recoilOffset;

                

                // --- [두 손 파지법 적용 (서기)] ---

                if (currentWeapon.name === '권총') {

                  playerSoldier.leftArm.rotation.x = Math.PI / 2 + camEuler.x;

                  playerSoldier.leftArm.rotation.y = 0.4;

                  playerSoldier.leftArm.position.set(-0.25, 1.25, -0.1);

                } else {

                  playerSoldier.leftArm.rotation.x = 1.1 + camEuler.x * 0.5;

                  playerSoldier.leftArm.rotation.y = -0.4;

                  playerSoldier.leftArm.position.set(-0.35, 1.2, -0.2);

                }

              } else {

                playerSoldier.leftArm.rotation.x = swing * 0.8;

                playerSoldier.rightArm.rotation.x = -swing * 0.8;

                playerSoldier.leftArm.rotation.y = 0;

                playerSoldier.rightArm.rotation.y = 0;

              }

            }

          }

        }



        // --- [조준(Iron Sights) 위치 보정] ---

        const isIronSight = (isZooming && currentScope === SCOPES.NONE && currentWeapon !== WEAPONS.PUNCH);

        ironSightWeight += (isIronSight ? 1 : -1) * 15 * delta;

        ironSightWeight = Math.max(0, Math.min(1, ironSightWeight));

        

        if (!isTPP || isZooming) {

          // 1인칭 이거나 줌 조준/견착 위치 변화

          const yOffset = (currentEyeY - 1.25);

          

          // 기본 1인칭 총 자세 (오른쪽 약간 아래 위치)

          let targetRX = 0.15; 

          let targetRY = yOffset - 0.2; 

          let targetRZ = -0.3;



          if (ironSightWeight > 0) {

            // Doom 스타일 정조준: 화면 하단에 무기 배치하고 중앙 크로스헤어를 비스듬히 조준

            targetRX = THREE.MathUtils.lerp(targetRX, -0.22, ironSightWeight);

            targetRY = THREE.MathUtils.lerp(targetRY, yOffset - 0.38, ironSightWeight);

            targetRZ = THREE.MathUtils.lerp(targetRZ, -0.45, ironSightWeight);

            

            // 총구를 위로 살짝 틸트하여 화면 중앙을 조준

            playerSoldier.rightArm.rotation.x -= 0.18 * ironSightWeight;

          }



          // 사격 시 총기가 뒤로 킥백하는 물리 모션 추가

          const recoilKick = playerRecoilTime > 0 ? (playerRecoilTime / 0.15) * 0.16 : 0;



          playerSoldier.rightArm.position.x += targetRX;

          playerSoldier.rightArm.position.y += targetRY;

          playerSoldier.rightArm.position.z += targetRZ + recoilKick;



          // 왼손도 개머리판 위치로 이동 및 반동 반영

          playerSoldier.leftArm.position.x += 0.25 * (1 - ironSightWeight) + 0.12 * ironSightWeight;

          playerSoldier.leftArm.position.y += (yOffset - 0.2) * (1 - ironSightWeight) + (yOffset - 0.32) * ironSightWeight;

          playerSoldier.leftArm.position.z += -0.2 * (1 - ironSightWeight) - 0.4 * ironSightWeight + recoilKick;

        }



        // 카메라의 기존 Z축 롤(기울기) 값을 초기화하여 마우스 회전값 누적으로 인한 롤 드리프트 방지

        const baseCamEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion);

        baseCamEuler.z = 0;

        camera.quaternion.setFromEuler(baseCamEuler);



        // 전술 기울이기 (Q/E Peeking) 상태 보간

        const targetLean = (playerStance === 'PRONE' || gameState !== 'PLAYING') ? 0 : ((leanState.left ? -1 : 0) + (leanState.right ? 1 : 0));

        currentLean += (targetLean - currentLean) * 10 * delta;



        // 플레이어 캐릭터 목/몸통 기울이기 애니메이션 (3인칭 가시화)

        if (gameState === 'PLAYING') {

          playerSoldier.headGroup.rotation.z = -currentLean * 0.15;

          if (playerSoldier.body) playerSoldier.body.rotation.z = -currentLean * 0.10;

        } else {

          playerSoldier.headGroup.rotation.z = 0;

          if (playerSoldier.body) playerSoldier.body.rotation.z = 0;

        }



        // 5. 카메라 FPP/TPP 모드 Lerp 부드러운 전환

        const targetEyeY = (playerStance === 'STAND') ? 1.5 : ((playerStance === 'CROUCH') ? 0.9 : 0.25);

        const targetTppY = (playerStance === 'STAND') ? 1.6 : ((playerStance === 'CROUCH') ? 1.0 : 0.4);

        currentEyeY += (targetEyeY - currentEyeY) * 10 * delta;

        currentTppY += (targetTppY - currentTppY) * 10 * delta;



        if (isTPP && !isZooming) {

          myPlayerGroup.visible = true;

          playerSoldier.headGroup.visible = true;

          playerSoldier.body.visible = true;

          if (playerSoldier.backpackGroup) playerSoldier.backpackGroup.visible = true;



          myPlayerGroup.position.copy(playerPos);

          myPlayerGroup.position.y += getSlopeLift(playerPos.x, playerPos.z);

          myPlayerGroup.rotation.y = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

          

          // 3인칭: 우측 기본 마진(0.6)에 기울이기 가산 적용

          const offset = new THREE.Vector3(0.6 + currentLean * 0.5, currentTppY + bobY, 3.5); offset.applyQuaternion(camera.quaternion);

          camera.position.copy(playerPos).add(offset);

          camera.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -currentLean * 0.08));

        } else {

          // 1인칭 및 정조준(ADS): 시점 자체를 좌/우측으로 수평 시프트 및 카메라 틸트(롤) 적용

          const leanOffset = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(currentLean * 0.45);

          camera.position.copy(playerPos).add(new THREE.Vector3(0, currentEyeY + bobY, 0)).add(leanOffset);

          camera.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -currentLean * 0.08));



          if (isZooming && currentScope !== SCOPES.NONE) {

            // 조준경 조준 시 시야 확보 (플레이어 모델 비표시)

            myPlayerGroup.visible = false;

          } else {

            // 지향사격(견착)이거나 줌 1인칭 모드: 총기를 드러냄

            myPlayerGroup.visible = true;

            playerSoldier.headGroup.visible = false;

            playerSoldier.body.visible = false;

            if (playerSoldier.backpackGroup) playerSoldier.backpackGroup.visible = false;

            

            myPlayerGroup.position.copy(playerPos);

            myPlayerGroup.position.y += getSlopeLift(playerPos.x, playerPos.z);

            myPlayerGroup.rotation.y = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ').y;

          }

        }

        updateSoldierJoints(playerSoldier);



        let isInsideBlueZone = false;

        if (!hasWonMatch) {

          if(zoneState === 'SHRINKING') {

            currentZoneRadius -= shrinkSpeed * delta;

            if(currentZoneRadius <= playZoneRadius) currentZoneRadius = playZoneRadius;

            zoneMesh.scale.set(currentZoneRadius/500, 1, currentZoneRadius/500);

          }

          if(Math.sqrt(playerPos.x**2 + playerPos.z**2) > currentZoneRadius) {

            updatePlayerHp(-3 * delta, null);

            isInsideBlueZone = true;

          }

        } else {

          if (zoneMesh.visible) zoneMesh.visible = false;

        }



        const bzOverlay = document.getElementById('bluezone-overlay');

        if (bzOverlay) {

          if (isInsideBlueZone && gameState === 'PLAYING') {

            bzOverlay.style.display = 'block';

            bzOverlay.style.animation = 'bluezonePulse 2s infinite ease-in-out';

          } else {

            bzOverlay.style.display = 'none';

            bzOverlay.style.animation = 'none';

          }

        }



        let nearItem = false;

        for (let i = 0; i < lootBoxes.length; i++) {

          if (playerPos.distanceTo(lootBoxes[i].mesh.position) < 3.5) {

            nearItem = true;

            break;

          }

        }

        if (nearItem) {

          if (!isInventoryOpen) {

            document.getElementById('loot-prompt').style.display = 'block';

          }

          if (isInventoryOpen && Math.random() < 0.05) {

            updateInventoryUI(); 

          }

        } else {

          document.getElementById('loot-prompt').style.display = 'none';

        }



        // 모바일 터치 디바이스 전용 컨텍스트 기반 인터랙션 버튼 상태 업데이트

        if (isTouchDevice) {

          const interactBtn = document.getElementById('btn-interact');

          if (interactBtn) {

            let closestDoor = null;

            let minDoorDist = 2.5; // 최대 문 상호작용 거리 2.5m

            doorsList.forEach(door => {

              const dist = playerPos.distanceTo(door.worldPos);

              if (dist < minDoorDist) {

                closestDoor = door;

                minDoorDist = dist;

              }

            });



            if (closestDoor) {

              interactBtn.style.display = 'flex';

              interactBtn.innerText = closestDoor.isOpen ? "🚪 닫기" : "🚪 열기";

            } else if (nearItem) {

              interactBtn.style.display = 'flex';

              interactBtn.innerText = "📦 줍기";

            } else {

              interactBtn.style.display = 'none';

            }

          }

        }

      }



      // 적 AI 밸런스 및 2D 체력바 UI 업데이트

      enemies.forEach(e => {

        if(e.hp <= 0) return;

        let isEnemySwimming = false;

        

        // 1. 머리 위 체력 게이지 투영 업데이트

        if(e.state === 'PLAYING' && (clock.getElapsedTime() - e.lastHitTime < 5)) {

          const hpPos = e.mesh.position.clone().add(new THREE.Vector3(0, 2.2, 0));

          hpPos.project(camera);

          if(hpPos.z < 1) {

            e.hpUI.bg.style.display = 'flex';

            e.hpUI.bg.style.left = (hpPos.x * 0.5 + 0.5) * window.innerWidth + 'px';

            e.hpUI.bg.style.top = (hpPos.y * -0.5 + 0.5) * window.innerHeight + 'px';

            e.hpUI.fill.style.width = ((e.hp / e.maxHp) * 100) + '%';

          } else {

            e.hpUI.bg.style.display = 'none';

          }

        } else {

          e.hpUI.bg.style.display = 'none';

        }



        if(e.state === 'IN_PLANE') {

          e.mesh.position.copy(planeGroup.position);

          e.mesh.rotation.copy(planeGroup.rotation);

          e.mesh.rotation.y += Math.PI; // 비행기 진행 방향을 바라보도록 설정

          if(flightTime > e.jumpTime) e.state = 'FALLING';

        } else if(e.state === 'FALLING') {

          // 바다로 벗어나는 경우 맵 중심으로 스티어링

          const dist = Math.sqrt(e.mesh.position.x * e.mesh.position.x + e.mesh.position.z * e.mesh.position.z);

          if (dist > 220) {

            e.driftAngle = Math.atan2(-e.mesh.position.z, -e.mesh.position.x) + (Math.random() - 0.5) * 0.4;

          }

          

          e.mesh.position.y -= 20 * delta;

          // 비행기에서 쏟아지는 대신 글라이딩 드리프트로 사방으로 펼쳐짐

          const dx = Math.cos(e.driftAngle) * e.driftSpeed * delta;

          const dz = Math.sin(e.driftAngle) * e.driftSpeed * delta;

          e.mesh.position.x += dx;

          e.mesh.position.z += dz;

          

          // 적군 스카이다이빙 자세 적용 (배를 바닥방향으로 엎드린 채, 글라이딩 진행 방향을 바라봄 - YXZ 순서로 회전 보정)

          e.mesh.rotation.set(-Math.PI * 0.45, e.driftAngle + Math.PI, 0, 'YXZ');

          updateSkydivePose(e.soldier, 0, 0, false);

          

          if(e.mesh.position.y < getElevation(e.mesh.position.x, e.mesh.position.z, e.mesh.position.y) + 30) { e.state = 'PARACHUTING'; e.parachute.visible = true; }

        } else if(e.state === 'PARACHUTING') {

          e.mesh.position.y -= 7 * delta;

          

          // 바다로 벗어나는 경우 맵 중심으로 스티어링

          const distP = Math.sqrt(e.mesh.position.x * e.mesh.position.x + e.mesh.position.z * e.mesh.position.z);

          if (distP > 220) {

            e.driftAngle = Math.atan2(-e.mesh.position.z, -e.mesh.position.x) + (Math.random() - 0.5) * 0.4;

          }

          

          const swingX = Math.sin(clock.getElapsedTime() * 4.2 + e.driftAngle) * 0.14;

          const swingZ = Math.cos(clock.getElapsedTime() * 3.2 + e.driftAngle) * 0.08;

          e.mesh.rotation.x = swingX;

          e.mesh.rotation.z = swingZ;

          e.parachute.rotation.x = swingX * 0.4;

          e.parachute.rotation.z = swingZ * 0.4;

          const dx = Math.cos(e.driftAngle) * (e.driftSpeed * 0.8) * delta;

          const dz = Math.sin(e.driftAngle) * (e.driftSpeed * 0.8) * delta;

          e.mesh.position.x += dx;

          e.mesh.position.z += dz;

          

          // 적군 낙하산 활강 자세 적용 (다리가 아래인 선 자세, 활강 방향을 바라봄)

          e.mesh.rotation.y = e.driftAngle + Math.PI;

          updateSkydivePose(e.soldier, 0, 0, true);

          

          const gY = getElevation(e.mesh.position.x, e.mesh.position.z, e.mesh.position.y);

          if(e.mesh.position.y <= gY) {

            e.mesh.position.y = gY;

            e.state = 'PLAYING';

            e.mesh.rotation.x = 0;

            e.mesh.rotation.z = 0;

            e.parachute.visible = false;

            e.soldier.parachuteBag.visible = false;

            if (e.bag) e.soldier.updateBagVisual(e.bag);

          }

        } else if(e.state === 'PLAYING') {

          isEnemySwimming = (getWaterLevel(e.mesh.position.x, e.mesh.position.z) - getElevation(e.mesh.position.x, e.mesh.position.z, false) >= 0.55);

          const distToCenter = Math.sqrt(e.mesh.position.x**2 + e.mesh.position.z**2);

          const isOutside = distToCenter > currentZoneRadius - 10;

          

          if (isOutside && e.hp > 0) {

            e.hp -= 1.5 * delta;

            if (e.hp <= 0) {

              totalAlive--;

              addKillLog(`${e.id} 자기장 사망`);

              spawnCorpseBox(e.mesh.position, e.weapon, Math.random() > 0.5 ? SCOPES.X2 : SCOPES.NONE, e.helmet, e.bag);

              scene.remove(e.mesh);

              e.hpUI.bg.style.display='none';

              checkVictory();

              return;

            }

          }



          // 다리 흔들기 애니메이션

          const swing = Math.sin(clock.getElapsedTime() * 12) * 0.5;

          e.soldier.leftThigh.rotation.x = swing;

          e.soldier.rightThigh.rotation.x = -swing;

          e.soldier.leftKnee.rotation.x = swing < 0 ? swing * 1.2 : 0;

          e.soldier.rightKnee.rotation.x = -swing < 0 ? -swing * 1.2 : 0;



          // 1. 목표 방향(desiredDir) 및 속도(moveSpeed) 결정

          let desiredDir = null;

          let moveSpeed = 0;

          let lookTarget = null;



          // 1. 타겟 검색 및 공격 (언제나 수행)

          let closestDist = 9999;

          let targetPos = null;

          if (playerHp > 0) {

            let playerObscured = false;

            for (let sc of activeSmokeClouds) {

              if (playerPos.distanceTo(sc.group.position) < 6.5) { playerObscured = true; break; }

              const distToCloud = sc.group.position.distanceTo(e.mesh.position);

              if (distToCloud < 75) {

                const toTarget = new THREE.Vector3().subVectors(playerPos, e.mesh.position);

                const toCloud = new THREE.Vector3().subVectors(sc.group.position, e.mesh.position);

                const projection = toCloud.dot(toTarget.clone().normalize());

                if (projection > 0 && projection < toTarget.length()) {

                  const closestPoint = e.mesh.position.clone().addScaledVector(toTarget.clone().normalize(), projection);

                  if (closestPoint.distanceTo(sc.group.position) < 6.5) { playerObscured = true; break; }

                }

              }

            }

            if (!playerObscured) {

              closestDist = e.mesh.position.distanceTo(playerPos);

              targetPos = playerPos.clone();

            }

          }



          enemies.forEach(other => {

            if (other.id !== e.id && other.hp > 0 && other.state === 'PLAYING') {

              let otherObscured = false;

              for (let sc of activeSmokeClouds) {

                if (other.mesh.position.distanceTo(sc.group.position) < 6.5) { otherObscured = true; break; }

                const distToCloud = sc.group.position.distanceTo(e.mesh.position);

                if (distToCloud < 75) {

                  const toTarget = new THREE.Vector3().subVectors(other.mesh.position, e.mesh.position);

                  const toCloud = new THREE.Vector3().subVectors(sc.group.position, e.mesh.position);

                  const projection = toCloud.dot(toTarget.clone().normalize());

                  if (projection > 0 && projection < toTarget.length()) {

                    const closestPoint = e.mesh.position.clone().addScaledVector(toTarget.clone().normalize(), projection);

                    if (closestPoint.distanceTo(sc.group.position) < 6.5) { otherObscured = true; break; }

                  }

                }

              }

              if (!otherObscured) {

                const d = e.mesh.position.distanceTo(other.mesh.position);

                if (d < closestDist) { closestDist = d; targetPos = other.mesh.position.clone(); }

              }

            }

          });



          const maxDetectDist = e.tier === 'Noob' ? 55 : (e.tier === 'Pro' ? 85 : 120);

          const hasTarget = (targetPos && closestDist < maxDetectDist && e.weapon !== WEAPONS.PUNCH);



          // 2. 우선순위에 따른 이동 방향(desiredDir) 및 속도(moveSpeed) 결정

          const needsToMoveToSafeZone = isOutside || (distToCenter > currentZoneRadius * 0.75) || (zoneState === 'SHRINKING' && distToCenter > playZoneRadius * 0.85);



          // Priority 1: 자기장 밖에서 데미지를 입는 긴박한 위기 상황 -> 안전지역으로 대피

          if (isOutside) {

            if (!e.safeZoneTarget || Math.sqrt(e.safeZoneTarget.x**2 + e.safeZoneTarget.z**2) > playZoneRadius * 0.8) {

              const angle = Math.random() * Math.PI * 2;

              const r = Math.random() * playZoneRadius * 0.7;

              e.safeZoneTarget = new THREE.Vector3(Math.cos(angle) * r, e.mesh.position.y, Math.sin(angle) * r);

            }

            desiredDir = new THREE.Vector3().subVectors(e.safeZoneTarget, e.mesh.position).normalize();

            moveSpeed = e.tier === 'Noob' ? 3.5 : (e.tier === 'Pro' ? 4.5 : 5.5);



            // 대피 중이라도 타겟이 있고 총이 있다면 조준 사격을 실시 (게걸음/뒷걸음 사격)

            if (hasTarget) {

              lookTarget = targetPos;

              const targetUpright = targetPos.clone(); targetUpright.y = e.mesh.position.y;

              e.mesh.lookAt(targetUpright); e.mesh.rotation.y += Math.PI;

              e.soldier.rightArm.rotation.x = Math.PI / 2 + (e.recoilTime > 0 ? 0.3 : 0);

              e.soldier.leftArm.rotation.x = 1.1; e.soldier.leftArm.rotation.y = -0.4;



              const fireDist = e.tier === 'Noob' ? 22 : (e.tier === 'Pro' ? 38 : 65);

              const shootInterval = (e.tier === 'Noob' ? 3.2 : (e.tier === 'Pro' ? 1.8 : 0.75)) * diffIntervalMult;

              if (closestDist <= fireDist && clock.getElapsedTime() - e.lastShot > shootInterval && !isEnemySwimming) {

                const jitter = (e.tier === 'Noob' ? 0.20 : (e.tier === 'Pro' ? 0.10 : 0.03)) * diffJitterMult;

                const imperfectTarget = targetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * jitter * closestDist, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * jitter * closestDist));

                fireBullet(e.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)), imperfectTarget, e.weapon, e.id);

                e.lastShot = clock.getElapsedTime();

              }

            } else {

              e.soldier.leftArm.rotation.set(0,0,0);

              e.soldier.rightArm.rotation.set(0,0,0);

            }

          }

          // Priority 2: 무기가 없는 맨주먹인 경우 -> 무조건 무기 파밍이 최우선

          else if (e.weapon === WEAPONS.PUNCH) {

            e.soldier.leftArm.rotation.set(0,0,0);

            e.soldier.rightArm.rotation.set(0,0,0);



            let nearestLoot = null;

            let nearestLootDist = 9999;

            for (let idx = 0; idx < lootBoxes.length; idx++) {

              const loot = lootBoxes[idx];

              if (loot.type === 'WEAPON' || (loot.isCrate && loot.weapon)) {

                // 건물 옥상/지붕 위에 올려진 무기 판정 (Y 높이 오차를 통해 필터링)

                const lootGroundY = getElevation(loot.mesh.position.x, loot.mesh.position.z, false);

                const isReachable = Math.abs(loot.mesh.position.y - (lootGroundY + 0.8)) < 1.5;



                // 건물 내부에 배치된 무기인지 판정 (안전하게 외부 필판 무기만 AI 타겟팅 허용)

                let insideBuilding = false;

                for (let b = 0; b < buildingSpots.length; b++) {

                  const spot = buildingSpots[b];

                  const hw = spot.w / 2;

                  const hd = spot.d / 2;

                  if (loot.mesh.position.x >= spot.x - hw && loot.mesh.position.x <= spot.x + hw &&

                      loot.mesh.position.z >= spot.z - hd && loot.mesh.position.z <= spot.z + hd) {

                    insideBuilding = true;

                    break;

                  }

                }



                if (isReachable && !insideBuilding) {

                  const distToLoot = e.mesh.position.distanceTo(loot.mesh.position);

                  if (distToLoot < nearestLootDist) {

                    nearestLootDist = distToLoot;

                    nearestLoot = { loot: loot, index: idx };

                  }

                }

              }

            }



            if (nearestLoot) {

              desiredDir = new THREE.Vector3().subVectors(nearestLoot.loot.mesh.position, e.mesh.position).normalize();

              moveSpeed = 4.8;

              lookTarget = nearestLoot.loot.mesh.position;



              if (nearestLootDist < 3.0) {

                if (nearestLoot.loot.isCrate) {

                  e.weapon = nearestLoot.loot.weapon;

                  nearestLoot.loot.weapon = null;

                } else {

                  e.weapon = nearestLoot.loot.val;

                  scene.remove(nearestLoot.loot.mesh);

                  lootBoxes.splice(nearestLoot.index, 1);

                }

                updateVisualEquip(e.soldier, e.weapon, SCOPES.NONE);

                if (isInventoryOpen) updateInventoryUI();

              }

            } else {

              // 필드에 무기가 아예 없을 때 대피 또는 배회

              if (needsToMoveToSafeZone) {

                if (!e.safeZoneTarget || Math.sqrt(e.safeZoneTarget.x**2 + e.safeZoneTarget.z**2) > playZoneRadius * 0.8) {

                  const angle = Math.random() * Math.PI * 2;

                  const r = Math.random() * playZoneRadius * 0.7;

                  e.safeZoneTarget = new THREE.Vector3(Math.cos(angle) * r, e.mesh.position.y, Math.sin(angle) * r);

                }

                desiredDir = new THREE.Vector3().subVectors(e.safeZoneTarget, e.mesh.position).normalize();

                moveSpeed = e.tier === 'Noob' ? 3.5 : (e.tier === 'Pro' ? 4.5 : 5.5);

              } else {

                if (!e.wanderDir || !e.wanderTimer || e.wanderTimer <= 0) {

                  e.wanderDir = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();

                  e.wanderTimer = 2.0 + Math.random() * 1.5;

                }

                e.wanderTimer -= delta;

                desiredDir = e.wanderDir;

                moveSpeed = 1.5;

              }

            }

          }

          // Priority 3: 무기가 있고 공격 대상이 감지된 경우 -> 조준 사격 및 전투

          else if (hasTarget) {

            const targetUpright = targetPos.clone();

            targetUpright.y = e.mesh.position.y;

            if (e.mesh.position.distanceTo(targetUpright) > 0.65) {

              e.mesh.lookAt(targetUpright);

              e.mesh.rotation.y += Math.PI;

            }

            e.soldier.rightArm.rotation.x = Math.PI / 2 + (e.recoilTime > 0 ? 0.3 : 0);

            e.soldier.leftArm.rotation.x = 1.1;

            e.soldier.leftArm.rotation.y = -0.4;



            const fireDist = e.tier === 'Noob' ? 22 : (e.tier === 'Pro' ? 38 : 65);

            const shootInterval = (e.tier === 'Noob' ? 3.2 : (e.tier === 'Pro' ? 1.8 : 0.75)) * diffIntervalMult;

            if (closestDist <= fireDist && clock.getElapsedTime() - e.lastShot > shootInterval && !isEnemySwimming) {

              const jitter = (e.tier === 'Noob' ? 0.20 : (e.tier === 'Pro' ? 0.10 : 0.03)) * diffJitterMult;

              const imperfectTarget = targetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * jitter * closestDist, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * jitter * closestDist));

              fireBullet(e.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)), imperfectTarget, e.weapon, e.id);

              e.lastShot = clock.getElapsedTime();

            }



            // 전투 중에도 점진적으로 안전지대로 이동해야 한다면 사격하며 이동

            if (needsToMoveToSafeZone) {

              if (!e.safeZoneTarget || Math.sqrt(e.safeZoneTarget.x**2 + e.safeZoneTarget.z**2) > playZoneRadius * 0.8) {

                const angle = Math.random() * Math.PI * 2;

                const r = Math.random() * playZoneRadius * 0.7;

                e.safeZoneTarget = new THREE.Vector3(Math.cos(angle) * r, e.mesh.position.y, Math.sin(angle) * r);

              }

              desiredDir = new THREE.Vector3().subVectors(e.safeZoneTarget, e.mesh.position).normalize();

              moveSpeed = e.tier === 'Noob' ? 3.5 : (e.tier === 'Pro' ? 4.5 : 5.5);

              lookTarget = targetPos;

            } else {

              // 안전구역 내에 있고 전투 가능 거리일 때: 무조건 서서 쏘지 않고 지능적인 동적 무빙 사격 수행!
              if (e.combatMoveTimer === undefined) {
                e.combatMoveTimer = 0;
                e.combatMoveDir = 1;
              }
              if (e.combatMoveTimer <= 0) {
                e.combatMoveTimer = 1.5 + Math.random() * 2.0;
                e.combatMoveDir = Math.random() > 0.5 ? 1 : -1;
              }
              e.combatMoveTimer -= delta;

              const toTarget = new THREE.Vector3().subVectors(targetPos, e.mesh.position);
              toTarget.y = 0; toTarget.normalize();
              
              // 좌우 회피 기동 벡터 생성 (스트레이핑)
              const strafeDir = new THREE.Vector3(-toTarget.z, 0, toTarget.x).multiplyScalar(e.combatMoveDir);
              
              // 무기별 지능적 위치 잡기: 샷건은 돌격하고, 저격총/돌격소총은 너무 가까우면 뒤로 빠짐
              const pushPullDir = toTarget.clone();
              if (e.weapon === WEAPONS.SHOTGUN) {
                pushPullDir.multiplyScalar(0.75); // 샷건은 적 방향으로 인파이팅 전진 사격
              } else if (closestDist < 12.0) {
                pushPullDir.multiplyScalar(-0.65); // 너무 가까우면 아웃복싱으로 거리 벌리기
              } else {
                pushPullDir.multiplyScalar(0.0); // 적정 사거리에서는 좌우 와리가리 기동
              }
              
              desiredDir = strafeDir.add(pushPullDir).normalize();
              // 기민하게 사격하면서 움직이도록 이동 속도 밸런싱
              moveSpeed = e.tier === 'Noob' ? 1.5 : (e.tier === 'Pro' ? 2.5 : 3.6);
              lookTarget = targetPos;
            }

          }

          // Priority 4: 안전지대로 이동 결정

          else if (needsToMoveToSafeZone) {

            e.soldier.leftArm.rotation.set(0,0,0);

            e.soldier.rightArm.rotation.set(0,0,0);



            if (!e.safeZoneTarget || Math.sqrt(e.safeZoneTarget.x**2 + e.safeZoneTarget.z**2) > playZoneRadius * 0.8) {

              const angle = Math.random() * Math.PI * 2;

              const r = Math.random() * playZoneRadius * 0.7;

              e.safeZoneTarget = new THREE.Vector3(Math.cos(angle) * r, e.mesh.position.y, Math.sin(angle) * r);

            }

            desiredDir = new THREE.Vector3().subVectors(e.safeZoneTarget, e.mesh.position).normalize();

            moveSpeed = e.tier === 'Noob' ? 3.5 : (e.tier === 'Pro' ? 4.5 : 5.5);

          }

          // Priority 5: 평시 일반 배회

          else {

            e.soldier.leftArm.rotation.set(0,0,0);

            e.soldier.rightArm.rotation.set(0,0,0);



            if (distToCenter > currentZoneRadius * 0.7) {

              const toCenter = new THREE.Vector3(-e.mesh.position.x, 0, -e.mesh.position.z).normalize();

              toCenter.x += (Math.random() - 0.5) * 0.3;

              toCenter.z += (Math.random() - 0.5) * 0.3;

              desiredDir = toCenter.normalize();

              moveSpeed = 4.0;

            } else {

              if (!e.wanderDir || !e.wanderTimer || e.wanderTimer <= 0) {

                e.wanderDir = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();

                e.wanderTimer = 2.0 + Math.random() * 1.5;

              }

              e.wanderTimer -= delta;

              desiredDir = e.wanderDir;

              moveSpeed = 1.5;

            }

          }



          // 3. 장애물 회피 상태 처리

          if (e.avoidanceTimer > 0) {

            e.avoidanceTimer -= delta;

            desiredDir = e.avoidDir;

            if (moveSpeed === 0) moveSpeed = 4.0;

          }



          // [연못 탈출 알고리즘 (Pond Escape Bypass)]

          // 적군 봇이 연못에 들어간 경우, 수영 속도로 감속되더라도 최단거리로 신속히 연못 바깥으로 탈출하도록 이동 방향을 강제 조정합니다.



          if (isEnemySwimming) {

            let pondCenter = null;

            const distToPond1 = Math.sqrt((e.mesh.position.x - 60)**2 + (e.mesh.position.z - 80)**2);

            if (distToPond1 < 25 + 2.0) {

              pondCenter = new THREE.Vector3(60, e.mesh.position.y, 80);

            }

            const distToPond2 = Math.sqrt((e.mesh.position.x + 80)**2 + (e.mesh.position.z + 60)**2);

            if (distToPond2 < 20 + 2.0) {

              pondCenter = new THREE.Vector3(-80, e.mesh.position.y, -60);

            }



            if (pondCenter) {

              desiredDir = new THREE.Vector3().subVectors(e.mesh.position, pondCenter);

              desiredDir.y = 0;

              desiredDir.normalize();

              moveSpeed = 1.6; // 연못 탈출 시 속도를 약간 상향 조정하여 신속 이탈 유도

            }

          }



          // [건물 우회 회피 알고리즘 (Obstacle Circling Bypass)]

          // 건물의 정면 벽에 부딛히는 것을 사전에 차단하고, 벽을 만나면 측면으로 돌아 둥글게 원형 우회합니다.

          if (desiredDir && moveSpeed > 0) {

            buildingSpots.forEach(spot => {

              const dx = e.mesh.position.x - spot.x;

              const dz = e.mesh.position.z - spot.z;

              const dist = Math.sqrt(dx * dx + dz * dz);

              const maxDim = Math.max(spot.w, spot.d);

              

              const triggerDist = maxDim / 2 + 4.5;

              if (dist < triggerDist && dist > 0.5) {

                const toBot = new THREE.Vector3(dx, 0, dz);

                const toBotNorm = toBot.clone().normalize();

                

                // 만약 봇이 건물의 중심 방향(즉, 벽)으로 향하는 내향 벡터라면

                if (desiredDir.dot(toBotNorm) < -0.15) {

                  // 시계 방향 및 반시계 방향 접선 벡터 계산

                  const cw = new THREE.Vector3(-toBotNorm.z, 0, toBotNorm.x);

                  const ccw = new THREE.Vector3(toBotNorm.z, 0, -toBotNorm.x);

                  

                  // 원래 가려던 목표지점과 더 방향이 잘 맞는 접선 선택

                  const bestCirclingDir = cw.dot(desiredDir) > ccw.dot(desiredDir) ? cw : ccw;

                  

                  // 접선 방향(85%) + 외곽 척력(15%)를 믹스하여 부드러운 우회 궤적 유도

                  desiredDir.copy(bestCirclingDir).multiplyScalar(0.85).addScaledVector(toBotNorm, 0.15).normalize();

                }

              }

            });

          }



          // [Steering Force Field] 나무, 바위 근처에서 점진적인 척력 벡터 추가

          if (desiredDir && moveSpeed > 0) {

            const repelForce = new THREE.Vector3();

            

            // 나무, 바위로부터의 척력

            obstacles.forEach(obs => {
              if (obs.type === 'TREE' || obs.type === 'ROCK') {
                const dx = e.mesh.position.x - obs.x;
                const dz = e.mesh.position.z - obs.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const affectDist = obs.radius + 4.0;
                if (dist < affectDist && dist > 0.1) {
                  const strength = (1.0 - (dist / affectDist)) * 3.5;
                  repelForce.add(new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(strength));
                }
              } else if (obs.type === 'BUILDING') {
                // AI 캐릭터의 건물 벽 회피 및 우회 슬라이딩 조향 알고리즘
                const ex = e.mesh.position.x;
                const ez = e.mesh.position.z;
                const halfW = obs.w / 2;
                const halfD = obs.d / 2;
                const minX = obs.spotX - halfW;
                const maxX = obs.spotX + halfW;
                const minZ = obs.spotZ - halfD;
                const maxZ = obs.spotZ + halfD;
                
                const closestX = Math.max(minX, Math.min(ex, maxX));
                const closestZ = Math.max(minZ, Math.min(ez, maxZ));
                
                const dx = ex - closestX;
                const dz = ez - closestZ;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const affectDist = 5.2; // 5.2미터 벽면 감지선
                
                if (dist < affectDist && dist > 0.01) {
                  const strength = (1.0 - (dist / affectDist)) * 4.5;
                  const pushX = dx / dist;
                  const pushZ = dz / dist;
                  
                  // 건물에서 밀어내는 척력
                  repelForce.add(new THREE.Vector3(pushX, 0, pushZ).normalize().multiplyScalar(strength * 2.2));
                  // 건물 벽을 타고 흘러가도록 만드는 법선 접선 회전 벡터 조향력 추가 (드드드 떨림 방지 및 우회)
                  repelForce.add(new THREE.Vector3(-pushZ, 0, pushX).normalize().multiplyScalar(strength * 1.8));
                }
              }
            });




            // 연못(물가) 회피 및 우회 조향 추가 (물가 드드드 떨림 및 진입 반복 방지)
            const distToPond1 = Math.sqrt((e.mesh.position.x - 60)**2 + (e.mesh.position.z - 80)**2);
            if (distToPond1 < 27.5 && distToPond1 > 0.1) {
              const dx = e.mesh.position.x - 60;
              const dz = e.mesh.position.z - 80;
              const strength = (1.0 - (distToPond1 / 27.5)) * 5.0;
              repelForce.add(new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(strength * 1.5));
              repelForce.add(new THREE.Vector3(-dz, 0, dx).normalize().multiplyScalar(strength * 2.0));
            }
            const distToPond2 = Math.sqrt((e.mesh.position.x + 80)**2 + (e.mesh.position.z + 60)**2);
            if (distToPond2 < 22.5 && distToPond2 > 0.1) {
              const dx = e.mesh.position.x + 80;
              const dz = e.mesh.position.z + 60;
              const strength = (1.0 - (distToPond2 / 22.5)) * 5.0;
              repelForce.add(new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(strength * 1.5));
              repelForce.add(new THREE.Vector3(-dz, 0, dx).normalize().multiplyScalar(strength * 2.0));
            }

            desiredDir.add(repelForce).normalize();

          }



          // 4. 이동 실행 및 충돌 해결

          if (desiredDir && moveSpeed > 0) {

            if (lookTarget) {

              const targetUpright = lookTarget.clone();

              targetUpright.y = e.mesh.position.y;

              e.mesh.lookAt(targetUpright);

              e.mesh.rotation.y += Math.PI;

            } else if (e.avoidanceTimer <= 0) {

              // 회피 중이 아닐 때는 이동 방향 바라보기

              const lookPoint = e.mesh.position.clone().add(desiredDir);

              lookPoint.y = e.mesh.position.y;

              e.mesh.lookAt(lookPoint);

              e.mesh.rotation.y += Math.PI;

            } else {

              // 회피 중이면서 타겟이 없을 때는 회피 방향을 향해 바라봄으로써 부르르 떨리는 현상 제거

              const lookPoint = e.mesh.position.clone().add(desiredDir);

              lookPoint.y = e.mesh.position.y;

              e.mesh.lookAt(lookPoint);

              e.mesh.rotation.y += Math.PI;

            }

            e.mesh.position.add(desiredDir.clone().multiplyScalar(moveSpeed * delta));

            

            const colNormal = new THREE.Vector3();

            const wasCollided = resolveCollisions(e.mesh.position, 0.55, e.id, colNormal);

            if (wasCollided) {

              const nowTime = clock.getElapsedTime();

              if (!e.lastRedirectionTime || nowTime - e.lastRedirectionTime > 0.15) {

                e.lastRedirectionTime = nowTime;

                

                const currentDir = desiredDir ? desiredDir.clone() : new THREE.Vector3(0, 0, -1).applyQuaternion(e.mesh.quaternion).normalize();

                let chosenAvoidDir = new THREE.Vector3();

                

                if (colNormal.lengthSq() > 0.1) {

                  const t1 = new THREE.Vector3(-colNormal.z, 0, colNormal.x);

                  const t2 = new THREE.Vector3(colNormal.z, 0, -colNormal.x);

                  // 척력 요소 없이 순수 벽면 접선(좌/우 90도 회전) 방향 중 원래 목표 방향과 더 가까운 쪽을 선택

                  chosenAvoidDir.copy(t1.dot(currentDir) > t2.dot(currentDir) ? t1 : t2).normalize();

                } else {

                  const turnAngle = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;

                  chosenAvoidDir.copy(currentDir).applyAxisAngle(new THREE.Vector3(0, 1, 0), turnAngle).normalize();

                }

                

                // 회피 지속 시간을 늘려(1.5 ~ 2.2초) 벽 모퉁이를 확실히 돌 때까지 접선 방향으로 직진하게 함

                e.avoidanceTimer = 1.5 + Math.random() * 0.7;

                e.avoidDir.copy(chosenAvoidDir);

                

                // wander 배회 상태 방향도 동기화하여 자연스러운 우회 연계

                e.wanderDir = chosenAvoidDir.clone();

                e.wanderTimer = e.avoidanceTimer + 1.0;

                

                // 즉각적인 회전 반영을 위해 현재 프레임 이동 방향을 접선 방향으로 덮어씀

                desiredDir.copy(chosenAvoidDir);

              }

            }

          }



          if (e.recoilTime > 0) e.recoilTime -= delta;

          

          const enemyGroundY = getElevation(e.mesh.position.x, e.mesh.position.z, e.mesh.position.y);

          isEnemySwimming = (getWaterLevel(e.mesh.position.x, e.mesh.position.z) - enemyGroundY >= 0.55);

          

          if (isEnemySwimming) {

            e.mesh.position.y = getWaterLevel(e.mesh.position.x, e.mesh.position.z) - 0.55; // 수영 높이 고정

            if (moveSpeed > 0) moveSpeed = 1.3; // 수영 속도 감속

            

            // 수영 뼈대 애니메이션 실시간 강제 오버라이드 (엎드린 수평 수영 자세)

            e.soldier.body.rotation.x = Math.PI / 2.2;

            e.soldier.body.position.set(0, 0.25, 0);

            e.soldier.headGroup.position.set(0, 0.35, -0.4);

            e.soldier.headGroup.rotation.x = -Math.PI / 4;

            e.soldier.leftArm.position.set(-0.35, 0.3, -0.2);

            e.soldier.rightArm.position.set(0.35, 0.3, -0.2);

            e.soldier.leftLeg.position.set(-0.16, 0.25, 0.3);

            e.soldier.rightLeg.position.set(0.16, 0.25, 0.3);



            const swimCycle = Math.sin(clock.getElapsedTime() * 4 + e.id.charCodeAt(3));

            e.soldier.leftArm.rotation.set(Math.PI / 2 + swimCycle * 0.9, 0.4, -0.2);

            e.soldier.rightArm.rotation.set(Math.PI / 2 - swimCycle * 0.9, -0.4, 0.2);

            e.soldier.leftThigh.rotation.set(-Math.PI / 2.2 + swimCycle * 0.4, 0, 0.1);

            e.soldier.rightThigh.rotation.set(-Math.PI / 2.2 - swimCycle * 0.4, 0, -0.1);

            const leftKneeAngle = 0.3 + Math.sin(clock.getElapsedTime() * 4 + e.id.charCodeAt(3) - Math.PI / 2) * 0.25;

            const rightKneeAngle = 0.3 + Math.sin(clock.getElapsedTime() * 4 + e.id.charCodeAt(3) + Math.PI / 2) * 0.25;

            e.soldier.leftKnee.rotation.set(leftKneeAngle, 0, 0);

            e.soldier.rightKnee.rotation.set(rightKneeAngle, 0, 0);

          } else {

            e.mesh.position.y = enemyGroundY + getSlopeLift(e.mesh.position.x, e.mesh.position.z);

            e.soldier.body.rotation.x = 0; // 서기 상태 초기화

            e.soldier.body.position.set(0, 0.95, 0);

            e.soldier.headGroup.position.set(0, 1.45, 0);

            e.soldier.leftArm.position.set(-0.38, 1.25, 0);

            e.soldier.rightArm.position.set(0.38, 1.25, 0);

            e.soldier.leftLeg.position.set(-0.16, 0.6, 0);

            e.soldier.rightLeg.position.set(0.16, 0.6, 0);

          }

          

          updateSoldierJoints(e.soldier);

        }

      });



      function disposeBullet(b) {

        if (b && b.mesh) {

          scene.remove(b.mesh);

        }

      }



      function disposeHierarchy(obj) {

        if (!obj) return;

        obj.traverse(child => {

          if (child.isMesh) {

            if (child.geometry) child.geometry.dispose();

            if (child.material) {

              if (Array.isArray(child.material)) {

                child.material.forEach(m => m.dispose());

              } else {

                child.material.dispose();

              }

            }

          }

        });

      }



      for(let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i]; 
        const prevPos = b.mesh.position.clone();
        const moveStep = b.dir.clone().multiplyScalar(60 * delta);
        b.mesh.position.add(moveStep); b.life -= delta;
        
        let hit = false;
        const samples = 8; 
        for (let s = 1; s <= samples; s++) {
          const testPos = prevPos.clone().addScaledVector(moveStep, s / samples);
          const distFromShooter = (b.shooterPos && typeof b.shooterPos.distanceTo === 'function') ? testPos.distanceTo(b.shooterPos) : 999;
          
          if (distFromShooter >= 2.0) {
            // 장애물(나무, 바위, 건물) 피격 판정
            for (let obs of obstacles) {
              if (obs.type === 'TREE' || obs.type === 'ROCK') {
                const dx = testPos.x - obs.x;
                const dz = testPos.z - obs.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < obs.radius) {
                  hit = true;
                  break;
                }
              } else if (obs.type === 'BUILDING') {
                const bx = testPos.x;
                const bz = testPos.z;
                const by = testPos.y;
                const hw = obs.w / 2;
                const hd = obs.d / 2;
                if (bx >= obs.spotX - hw && bx <= obs.spotX + hw &&
                    bz >= obs.spotZ - hd && bz <= obs.spotZ + hd &&
                    by >= obs.spotY && by <= obs.spotY + 5.5) {
                  hit = true;
                  break;
                }
              }
            }

            // 문 피격 판정
            if (!hit) {
              for (let door of doorsList) {
                if (!door.isOpen) {
                  const minX = door.x - door.w/2;
                  const maxX = door.x + door.w/2;
                  const minZ = door.z - door.d/2;
                  const maxZ = door.z + door.d/2;
                  const bx = testPos.x;
                  const bz = testPos.z;
                  const by = testPos.y;
                  const gY = getElevation(door.x, door.z);
                  if (bx >= minX && bx <= maxX && bz >= minZ && bz <= maxZ && by >= gY && by <= gY + 3.0) {
                    hit = true;
                    break;
                  }
                }
              }
            }

            // 플레이어 피격 판정 (현실적인 피격 상자 0.24m 머리, 0.48m 몸통으로 밸런스 패치)
            if (!hit && playerHp > 0 && b.owner !== 'PLAYER') {
              const headPos = playerPos.clone().add(new THREE.Vector3(0, currentEyeY, 0));
              const bodyPos = playerPos.clone().add(new THREE.Vector3(0, currentEyeY - 0.7, 0));
              const distHead = testPos.distanceTo(headPos);
              const distBody = testPos.distanceTo(bodyPos);
              
              if (distHead < 0.24 || distBody < 0.48) {
                let isHeadshot = distHead < 0.24;
                let damage = b.dmg;
                if (isHeadshot) {
                  damage *= 2.5;
                  if (playerInventory.helmet) {
                    damage *= (1 - playerInventory.helmet.reduction);
                  }
                }
                updatePlayerHp(-damage, b.shooterPos);
                hit = true;
              }
            }

            // 적 캐릭터 피격 판정
            if (!hit) {
              for (let e of enemies) {
                if (e.hp > 0 && e.state === 'PLAYING' && b.owner !== e.id) {
                  const headPos = e.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                  const bodyPos = e.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
                  const distHead = testPos.distanceTo(headPos);
                  const distBody = testPos.distanceTo(bodyPos);
                  
                  if (distHead < 0.24 || distBody < 0.48) {
                    let isHeadshot = distHead < 0.24;
                    let damage = b.dmg;
                    
                    if (b.owner !== 'PLAYER') {
                      damage *= 0.25;
                    }
                    
                    if (isHeadshot) {
                      damage *= 2.5;
                      if (e.helmet) {
                        damage *= (1 - e.helmet.reduction);
                      }
                      if (b.owner === 'PLAYER') showNotice("🎯 HEADSHOT!", 1000);
                    } else {
                      if (b.owner === 'PLAYER') showNotice("🎯 HIT!", 500);
                    }
                    
                    e.hp -= damage;
                    
                    // 오직 플레이어가 직접 가한 유효 타격일 때만 5초 노출을 트리거하도록 수정
                    if (b.owner === 'PLAYER') {
                      e.lastHitTime = clock.getElapsedTime();
                    }
                    
                    if (e.hp <= 0) {
                      totalAlive--;
                      scene.remove(e.mesh); e.hpUI.bg.style.display = 'none';
                      spawnCorpseBox(e.mesh.position, e.weapon, Math.random() > 0.5 ? SCOPES.X2 : SCOPES.NONE, e.helmet, e.bag);
                      addKillLog(`${b.owner === 'PLAYER' ? '플레이어' : b.owner} -> ${e.id} 처치 ${isHeadshot ? '(헤드샷)' : ''}`);
                      if (b.owner === 'PLAYER') {
                        killCount++;
                        document.getElementById('kill-count').innerText = killCount;
                      }
                      checkVictory();
                    }
                    hit = true;
                    break;
                  }
                }
              }
            }
          }

          // 닭 맞추기 판정
          if (!hit && victoryChicken && victoryChicken.group) {
            const distToCh = testPos.distanceTo(victoryChicken.group.position);
            if (distToCh < 3.2) {
              const pushForce = 15;
              victoryChicken.velX += b.dir.x * pushForce;
              victoryChicken.velZ += b.dir.z * pushForce;
              victoryChicken.velY = Math.max(8, victoryChicken.velY + 8);
              victoryChicken.landed = false;
              if (victoryChicken.bounces >= 3) {
                victoryChicken.bounces = 2;
              }
              hit = true;
              SoundSystem.playPunch(false);
            }
          }

          if (!hit) {
            for (let idx = liveChickens.length - 1; idx >= 0; idx--) {
              const c = liveChickens[idx];
              const dx = testPos.x - c.pos.x;
              const dz = testPos.z - c.pos.z;
              const horizDist = Math.sqrt(dx * dx + dz * dz);
              const vertDist = Math.abs(testPos.y - (c.mesh.position.y + 0.22));
              
              const hitRadius = c.mesh.userData.type === 'CHICK' ? 0.28 : 0.45;
              const hitHeight = c.mesh.userData.type === 'CHICK' ? 0.3 : 0.5;
              
              if (horizDist < hitRadius && vertDist < hitHeight) {
                c.panicTime = 2.5;
                c.dir.copy(b.dir).setY(0).normalize();
                hit = true;
                SoundSystem.playPunch(false);
                
                if (c.hitCount === undefined) c.hitCount = 0;
                c.hitCount++;
                if (c.hitCount >= 5) {
                  scene.remove(c.mesh);
                  const roasted = createRoastedChickenMesh();
                  let scale = c.mesh.userData.type === 'CHICK' ? 0.55 : 1.0;
                  roasted.scale.set(scale, scale, scale);
                  roasted.position.copy(c.pos);
                  const groundOffset = c.mesh.userData.type === 'CHICK' ? 0.12 : 0.22;
                  roasted.position.y = getElevation(c.pos.x, c.pos.z) + groundOffset;
                  scene.add(roasted);
                  roasted.castShadow = true;
                  roasted.receiveShadow = true;
                  SoundSystem.playPunch(true);
                  liveChickens.splice(idx, 1);
                  createShockwave(c.pos);
                }
                break;
              }
            }
          }

          if (hit) break;
        }

        if (hit || b.life <= 0) {
          disposeBullet(b);
          enemyBullets.splice(i, 1);
        }
      }
      for (let i = activeThrowables.length - 1; i >= 0; i--) {

        const t = activeThrowables[i];

        t.timer -= delta;

        t.vel.y -= 9.8 * 2 * delta; 

        t.pos.addScaledVector(t.vel, delta);

        t.mesh.position.copy(t.pos);

        

        const groundY = getElevation(t.pos.x, t.pos.z);

        if (t.pos.y <= groundY) {

          t.pos.y = groundY;

          t.vel.y = -t.vel.y * 0.4;

          t.vel.x *= 0.6;

          t.vel.z *= 0.6;

        }



        if (t.timer <= 0) {

          scene.remove(t.mesh);

          disposeHierarchy(t.mesh);

          if (t.type === 'GRENADE') {

            const expMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 });

            const expMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), expMat);

            expMesh.position.copy(t.pos);

            scene.add(expMesh);

            

            // Play spatial explosion sound

            const distToPlayer = playerPos.distanceTo(t.pos);

            const expVol = Math.max(0, 1 - distToPlayer / 150);

            if (expVol > 0.01) {

              SoundSystem.playExplosion(expVol);

            }



            const radius = 18; // 폭발 범위 확장 (10 -> 18)

            if (distToPlayer < radius && playerHp > 0) {

              let dmg = (1 - (distToPlayer / radius)) * 180; // 데미지 상향 (120 -> 180)

              if (playerInventory.helmet) dmg *= (1 - playerInventory.helmet.reduction);

              updatePlayerHp(-dmg, t.pos);

              showNotice("⚠️ 수류탄 폭발 치명적 피해!");

            }

            enemies.forEach(e => {

              if (e.hp > 0 && e.state === 'PLAYING') {

                const distToEnemy = e.mesh.position.distanceTo(t.pos);

                if (distToEnemy < radius) {

                  let dmg = (1 - (distToEnemy / radius)) * 180;

                  if (e.helmet) dmg *= (1 - e.helmet.reduction);

                  e.hp -= dmg;

                  e.lastHitTime = clock.getElapsedTime();

                  if (e.hp <= 0) {

                    totalAlive--;

                    scene.remove(e.mesh);

                    e.hpUI.bg.style.display = 'none';

                    spawnCorpseBox(e.mesh.position, e.weapon, Math.random() > 0.5 ? SCOPES.X2 : SCOPES.NONE, e.helmet, e.bag);

                    addKillLog(`수류탄 -> ${e.id} 처치`);

                    killCount++;

                    document.getElementById('kill-count').innerText = killCount;

                    checkVictory();

                  }

                }

              }

            });

            

            let scaleTime = 0;

            const expInterval = setInterval(() => {

              scaleTime += 0.04;

              const size = scaleTime * 45; // 시각적 폭발 크기 대폭 확장

              expMesh.scale.set(size, size, size);

              expMat.opacity = 1 - (scaleTime / 0.6);

              if (scaleTime >= 0.6) {

                clearInterval(expInterval);

                scene.remove(expMesh);

                expMesh.geometry.dispose();

                expMat.dispose();

              }

            }, 40);

            

          } else if (t.type === 'SMOKE') {

            const smokeGroup = new THREE.Group();

            smokeGroup.position.copy(t.pos);

            scene.add(smokeGroup);

            

            // Play spatial smoke hiss sound

            const distToPlayer = playerPos.distanceTo(t.pos);

            const smokeVol = Math.max(0, 1 - distToPlayer / 100);

            if (smokeVol > 0.01) {

              SoundSystem.playSmokeHiss(smokeVol);

            }

            

            const numPuffs = 12;

            const puffs = [];

            const cloudMat = new THREE.MeshStandardMaterial({

              color: 0xdddddd,

              transparent: true,

              opacity: 0,

              roughness: 0.9,

              depthWrite: false

            });

            

            for (let p = 0; p < numPuffs; p++) {

              const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), cloudMat);

              puff.position.set(

                (Math.random() - 0.5) * 2,

                (Math.random() - 0.5) * 1 + 1,

                (Math.random() - 0.5) * 2

              );

              smokeGroup.add(puff);

              puffs.push({

                mesh: puff,

                scale: 1 + Math.random() * 2,

                targetScale: 5 + Math.random() * 4,

                drift: new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.1, (Math.random() - 0.5) * 0.2)

              });

            }

            

            activeSmokeClouds.push({

              group: smokeGroup,

              puffs: puffs,

              material: cloudMat,

              timer: 15.0,

              phase: 'FADE_IN'

            });

          }

          activeThrowables.splice(i, 1);

        }

      }



      // 2. 연막탄 구름 시뮬레이션 업데이트

      for (let i = activeSmokeClouds.length - 1; i >= 0; i--) {

        const sc = activeSmokeClouds[i];

        sc.timer -= delta;

        sc.puffs.forEach(p => {

          if (sc.phase === 'FADE_IN') {

            p.mesh.scale.lerp(new THREE.Vector3(p.targetScale, p.targetScale, p.targetScale), delta * 2.0);

            sc.material.opacity = Math.min(0.85, sc.material.opacity + delta * 0.5);

            if (sc.material.opacity >= 0.8) sc.phase = 'STABLE';

          } else if (sc.timer < 3.0) {

            sc.material.opacity = Math.max(0, sc.material.opacity - delta * 0.3);

          }

          p.mesh.position.addScaledVector(p.drift, delta);

        });

        

        if (sc.timer <= 0) {

          sc.group.traverse(child => {

            if (child.isMesh) {

              if (child.geometry) child.geometry.dispose();

              if (child.material) {

                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());

                else child.material.dispose();

              }

            }

          });

          scene.remove(sc.group);

          activeSmokeClouds.splice(i, 1);

        }

      }

      

      drawMinimap();

      renderer.render(scene, camera);

    }

    animate();



    // 로딩 화면 부드럽게 숨기기

    const loadingScreen = document.getElementById('loading-screen');

    if (loadingScreen) {

      setTimeout(() => {

        loadingScreen.style.opacity = '0';

        setTimeout(() => {

          loadingScreen.style.display = 'none';

        }, 500);

      }, 500);

    }



    function checkOrientation() {

      if (isTouchDevice && window.innerHeight > window.innerWidth) {

        document.getElementById('portrait-warning').style.display = 'flex';

      } else {

        document.getElementById('portrait-warning').style.display = 'none';

      }

    }

    window.addEventListener('resize', () => { 

      camera.aspect = window.innerWidth / window.innerHeight; 

      camera.updateProjectionMatrix(); 

      renderer.setSize(window.innerWidth, window.innerHeight); 

      checkOrientation();

    });

    window.addEventListener('orientationchange', checkOrientation);

    checkOrientation();



    // 페이지가 새로고침되거나 종료될 때 GPU 메모리와 WebGL 컨텍스트의 잔재를 확실히 정리

    window.addEventListener('beforeunload', () => {

      if (typeof BulletCache !== 'undefined' && BulletCache) BulletCache.disposeAll();

      if (typeof muzzleFlashConeGeo !== 'undefined' && muzzleFlashConeGeo) muzzleFlashConeGeo.dispose();

      if (typeof muzzleFlashSphereGeo !== 'undefined' && muzzleFlashSphereGeo) muzzleFlashSphereGeo.dispose();

      if (typeof muzzleFlashConeMat !== 'undefined' && muzzleFlashConeMat) muzzleFlashConeMat.dispose();

      if (typeof muzzleFlashSphereMat !== 'undefined' && muzzleFlashSphereMat) muzzleFlashSphereMat.dispose();

      

      if (typeof scene !== 'undefined' && scene) {

        scene.traverse(child => {

          if (child.geometry) child.geometry.dispose();

          if (child.material) {

            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());

            else child.material.dispose();

          }

        });

      }

      if (typeof renderer !== 'undefined' && renderer) {

        renderer.dispose();

      }

    });

  