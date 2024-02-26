public static void Method(Integer nums[]) {
    int sum = 0;
    System.out.println("Original Array: ");
    System.out.println(Arrays.toString(nums));
    for (int i = 0; i < nums.length; i++) {
        sum = sum + nums[i];
    }

    double a = sum / nums.length;

    for (int i = 0; i < nums.length; i++) {
        if (nums[i] > a) {
            System.out.println(nums[i]);
        }
    }
}
