import json
import numpy as np
from sklearn.model_selection import train_test_split
from model_trainer import one_hot_encode
import argparse


# 1) Load the model - A bit awkward because of the new json format, and still needing to do the same one hot encoding thing
# dataset = loadTrainingSetFromCSV("../data/training_set.csv");
if __name__ == "__main__": 
    # Retrieve the data
    parser = argparse.ArgumentParser()
    parser.add_argument('--data')
    args = parser.parse_args()

    # 1) Get X,Y
    data = json.loads(args.data)
    print("data=", data)
    (_,_, unique_hobbies) = one_hot_encode(data)

    # Get evaluation data into form -----------------------
    f = open("../data/responses.json")
    eval_data = json.load(f)
    X_eval= [] 
    for i in range(0, len(eval_data)):
        eval_data_i = [ [e for e in eval_data[i]["HobbyJSON"] if e in unique_hobbies] ] 
        for q in range(1,16):
            eval_data_i.append( eval_data[i]["Question"+str(q)])
        X_eval.append(eval_data_i)

    n_eval =  len(eval_data)
    #------------------------------------------------------
    # Add the new eval entries to the end of the dataset so we can one hot encode easily, then just take them back at the end
    for e in X_eval: 
        data.append(e)

    (X,y, unique_hobbies) = one_hot_encode(data)

    X_eval = X[-n_eval:]; y_eval = y[-n_eval:]

    X_normal = X[:-n_eval]; y_normal = y[:-n_eval]
    X_train, X_test, y_train, y_test = train_test_split(X_normal,y_normal,random_state=42, shuffle=True, test_size=0.2)

    # Export datasets 
    np.savetxt("evaluation_data/train_set_x.csv", X_train, delimiter=",", fmt="%d")
    np.savetxt("evaluation_data/train_set_y.csv", y_train, delimiter=",", fmt="%d")

    np.savetxt("evaluation_data/test_set_x.csv", X_test, delimiter=",", fmt="%d")
    np.savetxt("evaluation_data/test_set_y.csv", y_test, delimiter=",", fmt="%d")

    np.savetxt("evaluation_data/eval_set_x.csv", X_eval, delimiter=",", fmt="%d")
    np.savetxt("evaluation_data/eval_set_y.csv", y_eval, delimiter=",", fmt="%d")

    f.close()