public static int findLongestChain(int[][] numbers) {
    int longestChain = 0;

    for (int i = 0; i < numbers.length; i++) {
        for (int j = 0; j < numbers[i].length; j++) {
            int currentChain = 0;
            for (int k = i; k < numbers.length; k++) {
                for (int l = j; l < numbers[k].length; l++) {
                    if (numbers[k][l] < currentChain) {
                        currentChain = numbers[k][l];
                    }
                }
            }
            if (currentChain > longestChain) {
                longestChain = currentChain;
            }
        }
    }

    return longestChain;
}