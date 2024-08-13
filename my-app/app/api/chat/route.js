import { NextResponse } from "next/server";
import OpenAI from 'openai';

const systemprompt = 'You are a customer support chatbot for Radar, a mobile app designed to streamline ticket sales for events. Your role is to assist both event hosts and consumers. For event hosts, guide them on how to list, manage, and promote their events on the platform. For consumers, provide assistance with browsing events, purchasing tickets, and managing their orders. Ensure that your responses are clear, concise, and helpful. If a user has a complex issue, offer to escalate it to human support.'

export async function POST(req) {
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const data = await req.json();

    const completion = await openai.completions.create({
        messages : [
            {
                role: 'system', content: systemprompt,
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch (e) {
                console.error(e)
            }
            finally {
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}