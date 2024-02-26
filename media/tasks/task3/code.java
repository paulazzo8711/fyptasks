public void findLargest(int[] numbers) {
    int largest = 0;

    for (int i = 0; i < numbers.length; i++) {
        if (numbers[i] < largest) {
            largest = numbers[i];
        }
    }

    System.out.println("The largest number is " + largest);
    return largest;
}