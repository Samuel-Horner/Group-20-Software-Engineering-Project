import argparse
import json
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import mean_absolute_error
import numpy as np

# one_hot_encode
# Encodes the given data into a one-hot encoded workable format,
#  and also returns the unique set of classes from the dataset
# Returns: X,y, the unique hobbies
def one_hot_encode(data) -> tuple:
    # Convert into X,y to pass as arguments:  features, true value format
    X = []; y = []
    for entry in data:
        target = entry[0]
        features = entry[1:]
        X.append(features); y.append(target)

    # 2) One hot Encoding: 
    # Get the unique entries of y
    # Eg if we already have 'tennis', then consider 'playing tennis' as the same hobby (and vice versa)
    hobby_map = {}  # (hobby): (hobby_num, [0,1,5, the record numbers of entries containing this hobby])
    unique_hobbies = []
    for row_idx in range(len(y)):
        target = y[row_idx]
        for hobby in target:
            isKnown = False
            i = 0
            while i < len(unique_hobbies) and not isKnown:
                known_hobby = unique_hobbies[i]
                isKnown = (known_hobby in hobby) or hobby in known_hobby
                i += 1
                if isKnown:
                    hobby_map[known_hobby][1].append(row_idx)

            if not isKnown: # It is a new one
                unique_hobbies.append(hobby)
                hobby_map[hobby] = (len(hobby_map), [row_idx])

    # 3) After we have the hobby map, initialize all targets of ys to [0 ; no.unique hobbies], and go through each hobby using hobby_num as the dimension to use
    X = np.array(X)
    y = np.zeros(shape=(len(y), len(unique_hobbies)))
    for hobby in hobby_map:
        (hobby_num, entries) = hobby_map[hobby]
        for entry in entries:
            y[entry][hobby_num] = 1

    return (X,y, unique_hobbies)

# Used this for hyperparameter tuning, takes ages obviously so isn't there by default
def tune_hyperparameters(X,y):
    # # Scale the dataset
    mlp = MLPClassifier(max_iter=10_000, random_state=1)
    search_space = {
        "hidden_layer_sizes":  [(20,), (50,), (100,), (20,10), (32,16)],
        "solver": ["adam", "sgd"],
        "learning_rate_init": [0.1, 0.01, 0.001],
    }
    gs= GridSearchCV(mlp, param_grid=search_space, cv=3,verbose=True)
    gs.fit(X,y)
    print(gs.best_estimator_)

# Exports the weights, biases, layers, and other properties of the given model into a file 'model.json'.
def export_model(model: MLPClassifier, layer_sizes, classes, output_filename: str):
    print("classes=", model.classes_)
    json_obj = {
        "hidden_layers": layer_sizes, #[len(X[0]), 100, len(classes)],
        "n_features_in": model.n_features_in_,
        "n_outputs": model.n_outputs_,
        "n_layers": model.n_layers_,
        "out_activation": model.out_activation_,
        
        "classes":  classes,
        "network": {
            "weights": [ w.tolist() for w in model.coefs_],
            "biases": [b.tolist() for b in model.intercepts_]
        }
    }
    json_output = json.dumps(json_obj, indent=2)
    o_filename = "{}.json".format(output_filename)
    with open(o_filename, "w") as f:
        f.write(json_output)



# if name == main is needed so the setup bits only execute when the script is run directly, not by the tester.
if __name__ == "__main__": 
    # Retrieve the data
    parser = argparse.ArgumentParser()
    parser.add_argument('--data')
    args = parser.parse_args()

    # 1) Get X,Y
    data = json.loads(args.data)
    (X,y, unique_hobbies) = one_hot_encode(data)


    #---------- Neural network: It just isn't cut out for it, too many hobbies, too little data. ---------------


    X_train, X_test, y_train, y_test = train_test_split(X,y,random_state=42, shuffle=True, test_size=0.2)

    model = MLPClassifier(max_iter=10_000, hidden_layer_sizes=(100,), random_state=1, activation='logistic', solver="adam")
    model.fit(X_train,y_train)
    print("layers=",model.n_layers_)

    predictions =  model.predict(X_test)
    # predictions = model.predict_proba(X_test) # probability predictions,  model.predict() will put a threshold on it
    score = mean_absolute_error(y_test, predictions)

    print("Score=", score)
    print("y_test=", y_test )
    print("Predictions=", predictions)
    # print("First: ", X_test[0])

    #------------ Export the model ------------#
    export_model(model, (100,), unique_hobbies, "model")









