public static int compute(int[] numbers) {
    int a = 0;
    int b = numbers[0];

    for (int i = 0; i < numbers.length; i++) {
        if (numbers[i] % 3 == 0) {
            a++;
        }
        if (b < numbers[i]) {
            b = numbers[i];
        }
    }
    return a - b;
}
