const db = require('./db');

const createCourses = async () => {
    const courses = [
        { id: 1, name: 'Guitarra', total_lessons: 63 },
        { id: 2, name: 'Piano', total_lessons: 70 }
    ];
    for (const course of courses) {
        const [ existingCourse ] = await db.query('SELECT * FROM Course WHERE id = ?', [course.id]);
        if (existingCourse.length > 0) {
            console.log(`El curso ${course.name} ya existe.`);
            continue;
        }
        await db.query('INSERT INTO Course (id, name, total_lessons) VALUES (?, ?, ?)', [course.id, course.name, course.total_lessons]);
        console.log(`El curso ${course.name} se creó correctamente.`);
    }
};

module.exports = createCourses;