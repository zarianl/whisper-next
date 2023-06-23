import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import {NextApiRequest, NextApiResponse} from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const audioData = Buffer.from(req.body.audio, 'base64');


        // Create form data instance
        let formData = new FormData();
        formData.append('file', audioData, {
            filename: 'audio.mp3',
            contentType: 'audio/mp3',
        });
        formData.append('model', 'whisper-1');

        try {
            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });

            console.log('response', response.data)

            // Send the transcription back to the client
            res.status(200).json(response.data);
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                console.log('error response', axiosError.response.data);
            }
            res.status(500).json({ error: axiosError.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
