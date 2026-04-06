# Model training
Run 'node model_trainer.js'.

This will take the dataset from backend/data/training_set.csv and train a Neural Network classifier on it.
The weights from the trained model are then stored in backend/dbManagement/reccomendation/model.json.
The weights are loaded into the model prediction background process as soon as the server has started running, so the model weights won't update for the server until the server has restarted.

# Requirements
See requirements.txt for the required python libraries, refer to the README.md at the root of the project for details.

# Model prediction
The file 'model_predictor.py' will be a background process initialized by the server in backend/index.js, and will run in the background, returning a prediction at runtime when it is called by getHobbyReccomdendation() in index.js.

# Testing
In the reccomendation directory, run:
$python -m pytest