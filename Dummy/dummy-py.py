# 1. Variables and Data Types
user_name = "Alex"          # String
user_age = 28               # Integer
is_active_user = True       # Boolean
shopping_list = ["apple", "banana", "coffee"]  # List

# 2. A Simple Function
def greet_user(name, age):
    """Prints a customized greeting message based on age."""
    print(f"Hello, {name}!")
    
    if age >= 18:
        print("Status: Access granted (Adult).")
    else:
        print("Status: Access restricted (Minor).")

# 3. Executing the Function
print("--- User Check ---")
greet_user(user_name, user_age)

# 4. Looping through a collection
print("\n--- Shopping Items ---")
for item in shopping_list:
    print(f"- Buy: {item}")
