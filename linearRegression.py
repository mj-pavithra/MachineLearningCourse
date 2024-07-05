import numpy as np
import matplotlib.pyplot as plt
# plt.style.use('./linearRegression.py')

x_train = np.array([1.0, 2.0 , 4.0])
y_train = np.array([300.0, 500.0, 700.06])

print(f"x_train: = {x_train}")
print(f"y_train: = {y_train}")

print(f"x_train.shape: = {x_train.shape}")

m = x_train.shape[0]
print(f"Number of trainning examples is: = {m}")

i = 2
x_i = x_train[i]
y_i = y_train[i]

print(f"(x^({i})), y^({i}) = ({x_i}, {y_i})")

plt.scatter(x_train, y_train, marker ='x' , c='r')

plt.title('House prices')

plt.ylabel('Price (in 100 USD)')
plt.xlabel('Size (in square feet)')
# plt.show()

w= 130
b = 200
print (f"Initial values of w and b are: w = {w}, b = {b}")

def compite_model_output(x, w, b):
    m =x.shape[0] # number of training examples
    f_wb = np.zeros(m) # model output
    print(f"f_wb = {f_wb}")
    for j in range (m):
        f_wb [j] = w * x[j] + b
        
        print(f"{j} 'th f_wb = {f_wb [j]}")
    return f_wb

temp_f_wb = compite_model_output(x_train, w, b)

plt.plot(x_train, temp_f_wb, c='b', label='Our Prediction')
plt.scatter(x_train, y_train, marker ='x' , c='r', label='Actual Values')

plt.title('House prices')
plt.ylabel('Price (in 100 USD)')
plt.xlabel('Size (in square feet)')
plt.legend()
plt.show()

w = 200
b = 100
x_i = 1.2
cost_1200sqft = w * x_i + b

print(f"${cost_1200sqft:.0f} thousand dollars")