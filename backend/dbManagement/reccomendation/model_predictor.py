from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelBinarizer
import json
import argparse
import numpy as np
# 1) Get the arguments: it will be the input that we're trying to predict
parser = argparse.ArgumentParser()
parser.add_argument("--input")
args = parser.parse_args()

x_raw = json.loads(args.input)
x = np.array(x_raw)

# x = np.array([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2])
# x= np.array([3,4,1,5,2,2,1, 2, 5, 2, 5, 5, 5, 3, 3]) # the first entry, test


# Use softmax to turn it into a probability distribution as the final output layer - improves interpretability
def softmax(prob_distn: np.ndarray, temperature: float) -> np.ndarray:
    sum = np.sum( np.exp(temperature*prob_distn))
    result =  np.exp(temperature*prob_distn) / sum 
    return result

# 2) Load weights into the neural network
with open("backend/dbManagement/reccomendation/model.json", "r") as f:
    data = json.load(f)

    hidden_layers= data["hidden_layers"]
    model = MLPClassifier(max_iter=10_000, hidden_layer_sizes=hidden_layers, random_state=1, activation='logistic',solver='adam')
    
    # Just used to handle assigning dimensions to the neural network, not for actual training
    temp_X = np.zeros(shape=(2, data["n_features_in"] )) 
    temp_y = np.zeros(shape=(2, data["n_outputs"]))
    model.fit(temp_X, temp_y)

    model.coefs_ = [np.array(w) for w in data["network"]["weights"] ] # convert back to numpy arrays
    model.intercepts_ = [np.array(b) for b in data["network"]["biases"] ]
    # prediction = model.predict([x])
    prediction = softmax( model.predict_proba([x])[0], 5.0)


    print( json.dumps({"classes": data["classes"] , "prediction": list(prediction) }) ) # Return the prediction to the caller