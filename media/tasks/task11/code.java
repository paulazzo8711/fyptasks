public static int calculateSum(int[] arr, int limit) {
    int sum = 0;
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] > limit) {
            sum += arr[i];
        }
    }
    int count = 0;
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] < 0) {
            count++;
        }
    }
    int res = sum - count;
    return res;
}
