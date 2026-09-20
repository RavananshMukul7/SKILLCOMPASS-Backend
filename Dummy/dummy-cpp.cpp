#include <iostream>
#include <string>

int main() {
    // Print a simple message to the console
    std::cout << "Hello! This is a dummy C++ program." << std::endl;

    // Ask for user input
    std::cout << "Enter your favorite programming language: ";
    std::string language;
    std::getline(std::cin, language);

    // Output the response
    std::cout << "Awesome! " << language << " is a great choice." << std::endl;

    return 0; // Signals successful execution
}
