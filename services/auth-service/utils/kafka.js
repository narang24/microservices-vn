import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'auth-service',
    brokers: [
    'kafka-statefulset-0.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-1.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-2.kafka-service.dev-ns.svc.cluster.local:9092'
    ]
});

const producer = kafka.producer();

const connectToKafka = async () => {
    try {
        await producer.connect();
        console.log('Producer connected successfully');
    } catch(error) {
        console.log('Error connecting to Kafka', error);
    }
}

const produceData = async ({ topic, message }) => {
    try{
        await producer.send({
            topic,
            messages: [{value: JSON.stringify(message)}]
        })
    } catch(error) {
        console.log('Error producing data', error);
    }
}

export { connectToKafka, produceData };
