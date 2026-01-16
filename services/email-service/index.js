import { Kafka } from "kafkajs";
import sendMail from "./helpers/sendMail.js";
import jwt from "jsonwebtoken";

const kafka = new Kafka({
    clientId: 'email-service',
    brokers: [
    'kafka-statefulset-0.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-1.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-2.kafka-service.dev-ns.svc.cluster.local:9092'
    ] 
})

const consumer = kafka.consumer({ groupId: 'email-service' });

const generateVerifyToken = (id) => {
    return jwt.sign({ id },process.env.JWT_VERIFY_SECRET,{ expiresIn: '1h' })
}

const run = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topics: ['auth-successful','event-successful','cron-job'],
            fromBeginning: true
        });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                switch(topic) {
                    case 'auth-successful':
                    {
                        const value = message.value.toString();
                        const { user, type } = JSON.parse(value);

                        switch(type) {

                            case 'login':
                            {
                                await sendMail(user.email,`Welcome Back, ${user.username}!`,`
                                <h3>Happen welcomes you!</h3>
                                <p>You just logged in at ${new Date().toLocaleString()}</p>
                                <p>If it wasn't you, please reset your password</p>
                                `);
                            }
                            break;

                            case 'verifyEmail':
                            {
                                const verifyToken = generateVerifyToken(user._id)
                                const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${verifyToken}`
                                await sendMail(user.email,'Verify your account',`
                                <p>Welcome, ${user.username}!</p>
                                <p>Click the link below to verify your account:</p>
                                <a href="${verifyUrl}">${verifyUrl}</a>
                                `); 
                            }
                            break;

                            case 'forgotPassword':
                            {
                                const resetToken = jwt.sign({ id: user._id },process.env.JWT_PASSWORD_SECRET,{ expiresIn: '15m' });
                                const resetUrl = `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`;   
                                await sendMail(user.email, 'Reset your Password',`
                                <h3>Forgot your password?</h3> 
                                <p>Click on the link below to reset (valid 15 min)</p>
                                <a href="${resetUrl}">${resetUrl}</a>
                                `);
                            }
                            break;

                            case 'resetPassword':
                            {
                                await sendMail(user.email, 'Password Reset',`
                                <h3>Your password was changed</h3> 
                                <p>New password was set at <b>${new Date().toLocaleString()}</b></p>
                                <p>Kindly protect your account, if it wasn't you</p>
                                `);
                            }
                            break;

                        }
                    }
                    break;
                    
                    case 'event-successful':
                    {
                        const value = message.value.toString();
                        const { user, event } = JSON.parse(value);

                        const statusUrl = `${process.env.SERVER_URL}/api/event/get-event/${event._id}/status`;
                        await sendMail(user.email,`Invitation for ${event.title}`,`
                        <p>Hey, you have been invited to grace the event</p>
                        <p>${event.title}</p>
                        <p>${event.description}</p>
                        <p>Date: ${event.date}</p>
                        <p>Location: ${event.location}</p>
                        <div style="display: flex; gap: 2em; justify-content: center; align-items: center;">
                            <a href="${statusUrl}?accepted=true&email=${user.email}" style="text-decoration: none; padding: 1em; font-size: 14px; border: 2px solid  #B7410E; background-color: transparent; color: #B7410E;">ACCEPT</a>
                            <a href="${statusUrl}?accepted=false&email=${user.email}" style="text-decoration: none; padding: 1em; font-size: 14px; border: 2px solid  #B7410E; background-color: transparent; color: #B7410E;">DECLINE</a>
                        </div>
                        `);
                    }
                    break;
                
                    case 'cron-job':
                    {
                    const value = message.value.toString();
                    const { event, email } = JSON.parse(value);
                    await sendMail(email, `Reminder for ${event.title}`, `
                    <p>Your gracious presence is awaited at</p>
                    <p>${event.title}</p>
                    <p>On ${event.date.toDateString()}</p>
                    <p>Taking place at ${event.location}</p>
                    <p>Description: ${event.description}</p>
                    `);
                    }
                    break;
                }
            }
        });
    } catch(error) {
        console.log('Error connecting to consumer', error);
    }
}

run();