from sklearn.neural_network import MLPClassifier
import sys
import json
# import argparse
import numpy as np

# Use softmax to turn it into a probability distribution as the final output layer - improves interpretability
def softmax(prob_distn: np.ndarray, temperature: float) -> np.ndarray:
    sum = np.sum( np.exp(temperature*prob_distn))
    result =  np.exp(temperature*prob_distn) / sum 
    return result

def input_is_valid(data, x)-> bool:
    if data["n_features_in"] != len(x):
        err = "Input to hobby reccomendation has length {}, when length {} is needed".format(len(x), data["n_features_in"])
        sys.stderr.write(err)
        return False 
    if not (min(x) > 0 and max(x) <= 5):
        err = "Recieved answers out of range."
        sys.stderr.write(err)
        return False
    return True
            

def make_prediction(data, x: np.ndarray):        
    model = MLPClassifier(max_iter=10_000, hidden_layer_sizes= data["hidden_layers"], random_state=1, activation='logistic',solver='adam')
    
    # Just used to handle assigning dimensions to the neural network, not for actual training
    temp_X = np.zeros(shape=(2, data["n_features_in"] )) 
    temp_y = np.zeros(shape=(2, data["n_outputs"]))
    model.fit(temp_X, temp_y)

    model.coefs_ = [np.array(w) for w in data["network"]["weights"] ] # convert back to numpy arrays
    model.intercepts_ = [np.array(b) for b in data["network"]["biases"] ]

    prediction = softmax( model.predict_proba([x])[0], 5.0)

    return prediction


# 1) Load weights into the neural network
if __name__ == "__main__":
    with open("backend/reccomendation/model.json", "r") as f:
        data = json.load(f)

        while True:
            x_raw = input() # Blocks on process.stdin until receives an input, with \n as a deliminator between requests in utf-8
            
            x = np.array( json.loads(x_raw))

            # Check if input is the correct size
            if not input_is_valid(data, x):
                continue

            prediction = make_prediction(data, x)

            print( json.dumps({"classes": data["classes"] , "prediction": list(prediction) }) ) # Return the prediction to the caller