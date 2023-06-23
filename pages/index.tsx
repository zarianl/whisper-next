import Head from 'next/head'
import Image from "next/image";
import styles from '../styles/Home.module.css'
import React, { useState, useMemo } from 'react';

// Use require instead of import, because the library does not have TypeScript types
const MicRecorder = require('mic-recorder-to-mp3');

const Home = () => {

    const [audio, setAudio] = useState<string | null>();
    const [transcript, setTranscript] = useState<string | null>();
    const [loading, setLoading] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [blobURL, setBlobURL] = useState("");
    const [isBlocked, setIsBlocked] = useState(false);

    // Explicitly type recorder as any to avoid TypeScript errors
    const recorder: any = useMemo(() => new MicRecorder({ bitRate: 128 }), []);

    const startRecording = () => {
        if (isBlocked) {
            console.log('Permission Denied');
        } else {
            recorder
                .start()
                .then(() => {
                    setIsRecording(true);
                })
                .catch((e: Error) => console.error(e));
        }
    }

    const stopRecording = () => {
        setIsRecording(false);
        // @ts-ignore
        recorder
            .stop()
            .getMp3()
            .then(([buffer, blob]: [BlobPart[], Blob]) => {
                const file = new File(buffer, 'test.mp3', {
                    type: blob.type,
                    lastModified: Date.now()
                });

                setBlobURL(URL.createObjectURL(file));
                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function () {
                    if (reader.result) {
                        const base64data = reader.result as string
                        const base64String = base64data.split(',')[1];
                        setAudio(base64String);
                    } else {
                        console.log('Failed to read file');
                    }
                }
            })
    }

    const handleSubmit = async(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setLoading(true);
        setIsRecording(false);

        const response = await fetch("/api/whisper", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio: audio }),
        });

        const data = await response.json();
        console.log('data', data)
        setLoading(false);
        setTranscript(data.text);

    };

    return (
        <div className={styles.container}>
            <Head>
                <title>OpenAI Whisper Demo</title>
                <meta name="description" content="OpenAI Whisper Next.js Template" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    Whisper 🤫
                </h1>

                <p className={styles.description}> Record audio to generate a transcript. </p>
                {isRecording ? <p className={styles.warning}> Recording in progress... </p> : <p className={styles.warning}> Requiresbrowser permission. </p>}
                {isBlocked ? <p className={styles.blocked}> Microphone access is blocked. </p> : null}

                <div className={styles.whispercontainer}>

                    <div className = {styles.allbuttons}>
                        <button onClick = {startRecording} disabled = {isRecording} className = {styles.recordbutton}>Record</button>
                        <button onClick = {stopRecording} disabled = {!isRecording} className = {styles.stopbutton}>Stop</button>
                    </div>

                    <div className = {styles.audiopreview}>
                        <audio src={blobURL} controls />
                    </div>
                    <div className = {styles.loading}>
                        {loading ? <p>Loading... please wait.</p> :  <p>{transcript}</p>}
                    </div>
                    <div className = {styles.generatebuttonroot}>
                        <button type = "submit" className = {styles.generatebutton} onClick = {handleSubmit} disabled = {!audio}>Generate</button>
                    </div>
                </div>
            </main>

        </div>
    )
}

export default Home;
