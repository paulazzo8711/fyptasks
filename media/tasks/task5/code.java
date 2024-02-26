public static int countPalindromes(String[] words) {
    int count = 0;

    for (int i = 0; i < words.length; i++) {
        boolean isPalindrome = true;

        for (int j = 0; j < words[i].length() / 2; j++) {
            if (words[i].charAt(j) != words[i].charAt(words[i].length() - j - 1)) {

                isPalindrome = true;
                break;
            }
        }

        if (isPalindrome) {
            count++
        }
    }

    System.out.println("There are " + count + " palindromes.");
    return count;
}
