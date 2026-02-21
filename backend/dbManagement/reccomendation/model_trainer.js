// U can use the database thing to fetch the data instead 
import {spawn} from 'child_process';
import {loadTrainingSetFromCSV} from '../training_set.js'; //You need to do "npm install csvtojson" to use this
let result = loadTrainingSetFromCSV("../../data/training_set.csv");

result.then( (e) => {
    //-------------- Send the data to python to handle ----------------------//
    // Runs in the console: python ml.py --data (the data)
    let jsonData = JSON.stringify(e);
    let args = ['model_trainer.py', '--data', jsonData]
        
    // Run the python process
    const process = spawn('python', args);

    process.stdout.setEncoding('utf-8');
    process.stdout.on('data', (msg) => {
        console.log(`Recieved: ${msg}`);
    });

    // Error handling
    process.stderr.setEncoding('utf8');
    process.stderr.on('data', (err) => {
        console.error("Error:", err);
    });
    process.on('exit', () => {console.log("Exited successfully") });
});

