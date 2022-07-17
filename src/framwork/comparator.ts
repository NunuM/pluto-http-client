
export interface Comparator<K> {
    compare(a: K, b: K): number;
}
