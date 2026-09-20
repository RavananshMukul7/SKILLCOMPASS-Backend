import java.util.Scanner; // Import the Scanner class to read user input

public class dummy {

    // The main method is the starting point of any Java program
    public static void main(String[] args) {
        
        // 1. Print a message to the console
        System.out.println("--- Welcome to the Java Demo Program ---");
        
        // 2. Variables and Data Types
        String languageName = "Java";
        int releaseYear = 1995;
        System.out.println(languageName + " was first released in " + releaseYear + ".");
        
        // 3. User Input and Control Flow
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String userName = scanner.nextLine(); 
        
        System.out.print("Enter your birth year: ");
        int birthYear = scanner.nextInt();
        
        // Calculate age using a separate helper method
        int currentYear = 2026;
        int age = calculateAge(birthYear, currentYear);
        
        System.out.println("\nHello, " + userName + "!");
        System.out.println("You are turning " + age + " years old this year.");
        
        // 4. Conditional logic (If-Else statement)
        if (age >= 18) {
            System.out.println("Status: You are an adult.");
        } else {
            System.out.println("Status: You are a minor.");
        }
        
        // Close the scanner object to prevent memory leaks
        scanner.close();
        System.out.println("----------------------------------------");
    }

    /**
     * A simple custom method that calculates the difference between two years.
     */
    public static int calculateAge(int birthYear, int currentYear) {
        return currentYear - birthYear;
    }
}
