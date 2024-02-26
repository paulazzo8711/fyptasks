public static int compute(int[] numbers) {
    List<Integer> list = new ArrayList<>();
    for (int i = 0; i < numbers.length && numbers[i] != 999; i++) {
        list.add(numbers[i]);
    }

    List<Integer> list2 = new ArrayList<>();
    for (int i = 0; i < list.size(); i++) {
        int v = list.get(i);
        if (v < 0) {
            list2.add(v);
        }
    }
    int x = 0;
    for (int i = 0; i < list2.size(); i++) {
        x += list2.get(i);
    }

    return x;
}
