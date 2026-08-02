// Sintetizador sutil usando Web Audio API
export const playSendSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    
    // Tono principal
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // Tono suave

    // Frecuencia que sube suavemente (efecto 'despegue/envío' de nota grave a aguda)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);

    // Fade out suave para que no suene brusco
    gain.gain.setValueAtTime(0.15, now); // Volumen controlado (15%)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {
    // Si el navegador bloquea el audio no interrumpe la ejecución del código
  }
};