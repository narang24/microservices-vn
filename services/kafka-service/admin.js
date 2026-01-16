import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'kafka-service',
    brokers: [
    'kafka-statefulset-0.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-1.kafka-service.dev-ns.svc.cluster.local:9092',
    'kafka-statefulset-2.kafka-service.dev-ns.svc.cluster.local:9092'
    ]
});

const admin = kafka.admin();

const run = async () => {
    await admin.connect();
    await admin.createTopics({
        topics: [{topic: 'auth-successful'},{topic: 'event-successful'},{topic: 'create-invitation'},{topic: 'update-status'},{topic: 'cron-job'}]
    });
}

run();