public static int method(int[][] data) {
    int result = 0;
    for (int i = 0; i < data.length; i++) {
        for (int j = 0; j < data[i].length; j++) {
            if (data[i][j] % 2 == 0) {
                result += data[i][j];
            } else {
                result -= data[i][j];
            }
        }
    }

    return result;
}
