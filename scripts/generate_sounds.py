import wave
import struct
import math
import os
import random

def get_output_dir(subdir='sounds'):
    """Get the output directory for generated sounds."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, 'public', 'assets', subdir)
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

def save_wav(name, data, sample_rate=44100):
    """Save a list of floats as a 16-bit PCM WAV file."""
    output_dir = get_output_dir()
    file_path = os.path.join(output_dir, f"{name}.wav")

    with wave.open(file_path, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes (16-bit)
        wav_file.setframerate(sample_rate)

        for value in data:
            # Clamp value between -1.0 and 1.0
            value = max(-1.0, min(1.0, value))
            # Convert to 16-bit integer
            sample = int(value * 32767)
            wav_file.writeframes(struct.pack('<h', sample))

    print(f"Generated: {file_path}")

def generate_beep():
    """Classic system beep."""
    sample_rate = 44100
    duration = 0.15
    freq = 440.0
    data = []
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        # Sine wave with exponential decay
        val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 15)
        data.append(val)
    save_wav('beep', data)

def generate_quack():
    """Duck quack-ish sound."""
    sample_rate = 44100
    duration = 0.3
    data = []
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        # Modulated frequency for the 'quack' effect
        freq = 200 + 100 * math.sin(2 * math.pi * 8 * t)
        # Mix of square and sine with noise
        val = 0.4 * (1.0 if math.sin(2 * math.pi * freq * t) > 0 else -1.0)
        val += 0.2 * math.sin(2 * math.pi * freq * 2 * t)
        val += 0.1 * (random.random() * 2 - 1)
        # Envelope
        env = 1.0 if t < 0.2 else (0.3 - t) / 0.1
        data.append(val * env * 0.5)
    save_wav('quack', data)

def generate_droplet():
    """Water drop sound."""
    sample_rate = 44100
    duration = 0.2
    data = []
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        # Frequency sweep up
        freq = 400 + 1200 * (t/duration)**2
        val = math.sin(2 * math.pi * freq * t)
        # Sharp exponential decay
        env = math.exp(-t * 25)
        data.append(val * env * 0.6)
    save_wav('droplet', data)

def generate_indigo():
    """Metallic chime sound."""
    sample_rate = 44100
    duration = 0.5
    data = []
    frequencies = [440, 660, 880, 1100]
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        val = 0
        for f in frequencies:
            val += 0.25 * math.sin(2 * math.pi * f * t)
        # Slow decay
        env = math.exp(-t * 8)
        data.append(val * env * 0.5)
    save_wav('indigo', data)

def generate_sosumi():
    """Short, percussive sound."""
    sample_rate = 44100
    duration = 0.25
    data = []
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        # Frequency slightly slides down
        freq = 330 - 30 * (t/duration)
        # Mix of sine and harmonics
        val = 0.6 * math.sin(2 * math.pi * freq * t)
        val += 0.3 * math.sin(2 * math.pi * freq * 2.5 * t)
        # Medium decay
        env = math.exp(-t * 12)
        data.append(val * env * 0.5)
    save_wav('sosumi', data)

def generate_wild_eep():
    """Sharp, high-pitched eep."""
    sample_rate = 44100
    duration = 0.12
    data = []
    for i in range(int(duration * sample_rate)):
        t = i / sample_rate
        # High frequency square wave
        freq = 1500
        val = 1.0 if math.sin(2 * math.pi * freq * t) > 0 else -1.0
        # Rapid envelope
        if t < 0.02:
            env = t / 0.02
        elif t < 0.08:
            env = 1.0
        else:
            env = (0.12 - t) / 0.04
        data.append(val * env * 0.3)
    save_wav('wild-eep', data)

def main():
    print("Generating alert sounds...")
    generate_beep()
    generate_quack()
    generate_droplet()
    generate_indigo()
    generate_sosumi()
    generate_wild_eep()
    print("All sounds generated successfully.")

if __name__ == '__main__':
    main()
