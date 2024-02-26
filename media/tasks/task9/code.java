public static int method(int a, int b, int c) {
    int x = c + 1;
    int y = (c * x) + 1;

    int z = (b * x) + 1;
    int w = z + y - x;

    return w;
}
