from model_trainer import one_hot_encode, export_model
from model_predictor import softmax, input_is_valid, make_prediction
from sklearn.neural_network import MLPClassifier
import numpy as np
import os 
import pytest
import json

@pytest.fixture
def training_set_path():
    return "../data/training_set.csv"

@pytest.fixture
def get_test_data_info():
    test_data = [ [["video games", "running"], 5,3,5,5,4,5,1,2,5,5,3,4,4,5,4], [["video games","tennis","cooking"],5,3,4,5,5,2,5,5,4,4,2,5,5,5,5], [["gym", "reading"], 4,3,3,4,4,5,4,5,3,3,4,2,2,4,3 ]]
    return one_hot_encode(test_data)


def test_dataset_exists(training_set_path):
    if not os.path.exists(training_set_path):
        pytest.fail("Training dataset not found")


def test_one_hot_encode(get_test_data_info):
    # Try all possible combinations for this input
    (X,y,unique_hobbies)= get_test_data_info
    y_compared=  y ==  np.array( [[1, 1, 0, 0, 0, 0], [1, 0, 1, 1, 0, 0], [0, 0, 0, 0, 1, 1]]  )

    assert np.all(y_compared)
    assert unique_hobbies == ['video games', 'running', 'tennis', 'cooking', 'gym', 'reading']
    assert np.all(X[0] == [5,3,5,5,4,5,1,2,5,5,3,4,4,5,4]) and np.all(X[1] == [5,3,4,5,5,2,5,5,4,4,2,5,5,5,5]) and np.all(X[2]== [4,3,3,4,4,5,4,5,3,3,4,2,2,4,3])

@pytest.fixture
def test_export(get_test_data_info):
    # 1) Make sure the export produces the correct file at the end, model_test.json.
    temp_path = "model_temp.json"
    model = MLPClassifier(max_iter=10_000, hidden_layer_sizes=(2,), random_state=1, activation='logistic', solver="adam")   
    model.fit(get_test_data_info[0], get_test_data_info[1])

    assert not os.path.exists(temp_path) # The test won't work if this file already exists
    export_model(model,(2,), get_test_data_info[2], "model_temp")
    assert os.path.exists(temp_path)

    # 2) Make sure it has the expected properties 
    data = None
    try:
        f = open(temp_path, "r")
        data = json.load(f)
        f.close()
        #  Delete the test file at the end so it doesn't waste memory
        os.remove(temp_path)
        assert not os.path.exists(temp_path)

        weight_count = sum([ sum( [len(_w) for _w in layer ]) for layer in data["network"]["weights"]])
        bias_count = sum([ len(_b) for _b in data["network"]["biases"]]  )

        print(data["hidden_layers"])
        assert data["hidden_layers"][0] == 2
        assert data["n_features_in"] == 15
        assert data["n_outputs"] == 6
        assert data["out_activation"] == "logistic"
        assert data["classes"] ==  ["video games","running","tennis","cooking","gym","reading"]
        assert weight_count == 15*2 + 2*6
        assert bias_count == 2 + 6     
    except:
        pytest.fail("Failed to read the created model")
    
    return data


def test_input_validation(test_export):
    data = test_export
    correct =   np.array([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2])
    too_long =  np.array([5,3,4,5,5,2,5,5,4,4,2,5,5,5,5,7])
    too_short = np.array([5,3,4,5,5,2,5,5,4,4,2,5,5,5])
    empty = np.array([])
    out_of_range1 = np.array([1,4,0,2,4,2,3,3,1,2,4,5,5,4,2])
    out_of_range2 = np.array([1,4,1,2,4,10,3,3,1,2,4,5,5,6,2])


    assert input_is_valid(data,correct) 
    assert not input_is_valid(data,too_long)
    assert not input_is_valid(data, too_short)
    assert not input_is_valid(data, empty)
    assert not input_is_valid(data, out_of_range1)
    assert not input_is_valid(data, out_of_range2)

def test_softmax():
    inputs = [np.array([1., 2., 3.]),  np.array([-2., -1., -5.]),  np.array([1.]) ]
    assert np.all([ np.all(softmax(x,3.)>=0.) and np.all(softmax(x,3.) <= 1.) and abs(np.sum(softmax(x,3.))- 1) < 1e-6 for x in inputs] )

def test_prediction(test_export):
    data = test_export
    correct = np.array([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2])
    result = make_prediction(data, correct)
    assert len(result) == data["n_outputs"]






