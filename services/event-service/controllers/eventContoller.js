import axios from 'axios'
import Event from '../models/Event.js';
import { produceData } from '../utils/kafka.js';

const addEvent = async (req, res) => {
    const userId = req.user.id;
    const { title, date, time, location, description, participants} = req.body;

    if(!title || !date || !location) 
        return res.status(400).json({ message: 'All Required fields must be filled'});

    if(!participants || participants.length===0)
        return res.status(400).json({ message: 'At least one participant is required' })

    try {
        const event = await Event.create({
            title,
            date: new Date(date),
            time,
            location,
            description,
            participants,
            userId,
        });

        for(const participant of participants) {
            const { user } = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/check-invitee?email=${participant.email}`);
            if(user) {
                //create Invitation
                produceData({ topic:'create-invitation', message: { user, event, participant }});
            }
            produceData({ topic:'event-successful', message: { user, event }});

            // const isUser = await User.findOne({ email: participant.email });
            // if(isUser) {
            //     await Invitation.create({
            //         eventId: event._id,
            //         inviteeId: isUser._id,
            //         inviterId: userId,
            //         status: participant.status,
            //         date: date,
            //     });
            // };
        }

        res.status(201).json({ message: 'Event Added Successfully!'});

    } catch(error) {
        res.status(500).json({ message: 'Server Error' })
    }


}

const getAllEvents = async (req, res) => {
    const userId = req.user.id;

    try {
        const events = await Event.find({ userId }).sort({ date: -1 });
        res.status(200).json(events);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const getEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const order= {"Pending":1, "Accepted":2, "Declined":3};
    try {
        const event = await Event.findOne({ userId, _id:id });
        if(!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        event.participants = event.participants.sort((a,b) => order[a.status] - order[b.status]);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const editEvent = async (req, res)  => {
    const { id } = req.params;
    const userId = req.user.id;

    const { title, date, time, location, description, participants } = req.body;

    if(!title || !date || !location) 
        return res.status(400).json({ message: 'All Required fields must be filled'});

    if(!participants || participants.length===0)
        return res.status(400).json({ message: 'At least one participant is required' })

    try {
        const event = await Event.findOneAndUpdate({ userId, _id:id },{
            title,
            date,
            time,
            location,
            description,
            participants,
            userId,
        },{ new: true });
        if(!event)
            return res.status(404).json({ message: 'Event not found' })
        res.status(200).json({ message: 'Event Updated Successfully!' });
         
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const deleteEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const event = await Event.findOneAndDelete({ userId, _id:id });
        if(!event) 
            return res.status(404).json({ message: 'Event not found' });
        res.status(200).json({ message: 'Event deleted Successfully!' });

    } catch(error) {
        res.status(500).json({ message: "Server error" });
    }
}

const getRecentScheduledEvents = async (req, res) => {

    const userId = req.user.id;

    const now = new Date();
    
    try {
        const recentEvents = await Event.find({ userId, date: { $lt: now } }).sort({ date: -1 });

        const scheduledEvents = await Event.find({ userId, date: { $gte: now } }).sort({ date: 1 });

        if(!recentEvents || !scheduledEvents) {
            return res.status(404).json({ message: 'User Data not found' });
        }

        return res.status(200).json({ recentEvents, scheduledEvents });
    } catch(error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const updateStatus = async ({id, accepted, email}) => {
    try {
        
        const event = await Event.findOne({ _id: id });
        if(!event) return console.log('Event not found');

        const participant = event.participants.find(p => p.email===email);
        if(!participant) return console.log('Participantnot found');

        if(participant.status === 'Pending') 
            participant.status = accepted === "true" ? 'Accepted':'Declined';
        
        await event.save();

    } catch(error) {
        console.log('Error updating status', error);
    }
    
}

const sendReminders = async () => {

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1)

    try {
    const events = await Event.find({ date: {$gte: today, $lt: tomorrow}});
    events.forEach((event) => {
        event.participants.forEach((participant) => {
            if(participant.status === 'Accepted')
                produceData({ topic: 'cron-job', message:{ event, email: participant.email }});
            // sendMail(participant.email, `Reminder for ${event.title}`, `
            // <p>Your gracious presence is awaited at</p>
            // <p>${event.title}</p>
            // <p>On ${event.date.toDateString()}</p>
            // <p>Taking place at ${event.location}</p>
            // <p>Description: ${event.description}</p>
            // `);
        })
    })
    } catch(error) {
        console.log('Server Error');
    }
}

export { addEvent, getAllEvents, getEvent, editEvent, deleteEvent, getRecentScheduledEvents, sendReminders, updateStatus };