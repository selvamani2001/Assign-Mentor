const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MONGODB_URI, PORT } = require('./utils/config');
const app = express();

app.use(express.json());

app.use(cors());

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connecting to MongoDB');
    app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const mentorSchema = new mongoose.Schema({
  mentor_id: Number,
  mentor_name: String,
  course: String,
  mentees: Array
}, { versionKey: false });

const studentSchema = new mongoose.Schema({
  student_id: Number,
  student_name: String,
  mentor_id: Number,
  course: String,
}, { versionKey: false }); 

const Student = mongoose.model('Student', studentSchema,); 
const Mentor = mongoose.model('Mentor', mentorSchema);

app.get('/', (req, res) => {
  res.send(`<h1 style="color: #333; text-align: center;">API END POINTS FOR Assign-Mentor</h1>

<div style="margin: 20px;">
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Endpoint</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Request</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/students</td>
            <td style="border: 1px solid #ddd; padding: 8px;">GET</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to get all students</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/mentors</td>
            <td style="border: 1px solid #ddd; padding: 8px;">GET</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to get all mentors</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/createMentor</td>
            <td style="border: 1px solid #ddd; padding: 8px;">POST</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to create a Mentor</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/createStudent</td>
            <td style="border: 1px solid #ddd; padding: 8px;">POST</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to create a Student</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/assignmentor/:mentorId/:studentId</td>
            <td style="border: 1px solid #ddd; padding: 8px;">POST</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to assign a Student to a Mentor</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/studentsWithoutMentor</td>
            <td style="border: 1px solid #ddd; padding: 8px;">GET</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to get students without a mentor</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/assignMentor/:studentId/:mentorId</td>
            <td style="border: 1px solid #ddd; padding: 8px;">PUT</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to assign or change Mentor for a particular Student</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/studentsForMentor/:mentorId</td>
            <td style="border: 1px solid #ddd; padding: 8px;">GET</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to get all students for mentor</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">/previousMentor/:studentId</td>
            <td style="border: 1px solid #ddd; padding: 8px;">GET</td>
            <td style="border: 1px solid #ddd; padding: 8px;">API to show the previously assigned mentor for a particular student</td>
        </tr>
    </table>
</div>
`)
});

// API to get all students
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching students');
    }
});

// API to get all mentors
app.get('/mentors', async (req, res) => {
    try {
        const mentors = await Mentor.find();
        res.json(mentors);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching mentors');
    }
});

// API to create a Mentor
app.post('/createMentor', async (req, res) => {
    try {
        const mentor = new Mentor(req.body);
        await mentor.save();
        res.json({ message: 'Mentor created successfully', mentor });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error creating Mentor' });
    }
});

// API to create a Student
app.post('/createStudent', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.json({ message: 'Student created successfully', student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating Student' });
    }
});

// API to assign a Student to a Mentor
app.post('/assignmentor/:mentorId/:studentId', async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const studentId = req.params.studentId;

    // Check if the mentor and student exist
    const mentor = await Mentor.findOne({ mentor_id: mentorId });
    const student = await Student.findOne({ student_id: studentId });

    if (!mentor || !student) {
      return res.status(404).json({ error: 'Mentor or student not found' });
    }

    // Check if the student already has a mentor
    if (student.mentor_id) {
      return res.status(400).json({ error: 'Student already has a mentor' });
    }

    // Assign the mentor to the student
    student.mentor_id = mentorId;
    await student.save();

    // Add the student to the mentor's mentees list
    mentor.mentees.push({ student_id: studentId });
    await mentor.save();

    res.status(200).json({ message: 'Student assigned to mentor successfully' });
  } catch (error) {
    console.error('Error assigning mentor to student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to get students without a mentor
app.get('/studentsWithoutMentor', async (req, res) => {
  try {
    const studentsWithoutMentor = await Student.find({ mentor_id: null });
    res.json(studentsWithoutMentor);
  } catch (error) {
    console.error('Error fetching students without mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to assign or change Mentor for a particular Student
app.put('/assignMentor/:studentId/:mentorId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const newMentorId = req.params.mentorId;

    // Check if the student exists
    const student = await Student.findOne({ student_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if the new mentor exists
    const newMentor = await Mentor.findOne({ mentor_id: newMentorId });

    if (!newMentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Change the mentor for the student
    student.mentor_id = newMentorId;
    await student.save();

    newMentor.mentees.push({ student_id: studentId });
    await newMentor.save();

    res.status(200).json({ message: 'Mentor assigned or changed successfully' });
  } catch (error) {
    console.error('Error assigning or changing mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to show all students for a particular mentor
app.get('/studentsForMentor/:mentorId', async (req, res) => {
  try {
    const mentorId = req.params.mentorId;

    // Check if the mentor exists
    const mentor = await Mentor.findOne({ mentor_id: mentorId });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Get all students for the mentor
    const studentsForMentor = await Student.find({ mentor_id: mentorId });
    res.json(studentsForMentor);
  } catch (error) {
    console.error('Error fetching students for mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to show the previously assigned mentor for a particular student
app.get('/previousMentor/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Check if the student exists
    const student = await Student.findOne({ student_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get the previously assigned mentor
    const previousMentorId = student.mentor_id;
    const previousMentor = await Mentor.findOne({ mentor_id: previousMentorId });

    res.json(previousMentor);
  } catch (error) {
    console.error('Error fetching previous mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

