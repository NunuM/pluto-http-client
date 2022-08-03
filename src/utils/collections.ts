import {Equals} from "../framework/equals";
import {Cloneable} from "../framework/cloneable";
import {Comparator} from "../framework/comparator";
import {Identifiable} from "../framework/identifiable";

export class MultiValueMap<T extends Cloneable<T> & Equals & Identifiable> {

    constructor(private _items = new Map<string, List<T>>) {
    }

    public add(obj: T): boolean {

        const k = obj.id().toLowerCase();

        if (!this._items.has(k)) {
            this._items.set(k, new List<T>());
        }

        this._items.get(k)?.push(obj);

        return true;
    }

    public get(key: string): List<T> | undefined {
        return this._items.get(key.toLowerCase());
    }

    public remove(key: string): boolean {
        return this._items.delete(key.toLowerCase());
    }

    clone(): MultiValueMap<T> {

        const newMap = new Map();

        for (let [key, value] of this._items.entries()) {
            newMap.set(key, value.clone());
        }

        return new MultiValueMap(newMap);
    }

    entries(): IterableIterator<[string, List<T>]> {
        return this._items.entries();
    }
}

type Primitive = string | boolean | number;

export class WrappedPrimitive<T> implements Cloneable<WrappedPrimitive<T>>, Equals, Identifiable {

    constructor(private _key: Primitive, private _value: Primitive) {
    }

    get key(): Primitive {
        return this._key;
    }

    value(): Primitive {
        return this._value;
    }

    clone(): WrappedPrimitive<T> {
        return new WrappedPrimitive<T>(this._key, this._value);
    }

    equals(other: any): boolean {
        if (other instanceof WrappedPrimitive) {
            return this._value === other._value;
        }
        return false;
    }

    id(): string {
        return this._key.toString().toLowerCase();
    }
}

export class PrimitiveMultiValueMap {

    private _map: MultiValueMap<WrappedPrimitive<Primitive>>;

    constructor() {
        this._map = new MultiValueMap<WrappedPrimitive<Primitive>>();
    }

    public add(key: Primitive, value: Primitive): boolean {
        return this._map.add(new WrappedPrimitive<Primitive>(key, value));
    }

    public remove(key: Primitive): boolean {
        return this._map.remove(key.toString());
    }


    entries(): IterableIterator<[string, Primitive[]]> {
        const o: { [key: string]: Primitive[] } = {};

        for (const [key, list] of this._map.entries()) {
            let k = key;

            const values: Primitive[] = [];

            for (const [_, p] of list.entries()) {
                values.push(p.value());
                k = p.key.toString();
            }

            o[k] = values;
        }

        return Object.entries(o)[Symbol.iterator]();
    }

}


class Entry<K, V> {

    private readonly _key: K;
    private _value: V;
    private _left?: Entry<K, V>;
    private _right?: Entry<K, V>;
    private readonly _parent?: Entry<K, V>;

    constructor(key: K, value: V, parent?: Entry<K, V>) {
        this._key = key;
        this._value = value;
        this._parent = parent;
    }


    get key(): K {
        return this._key;
    }

    get value(): V {
        return this._value;
    }

    set value(value: V) {
        this._value = value;
    }

    get left(): Entry<K, V> | undefined {
        return this._left;
    }

    set left(value: Entry<K, V> | undefined) {
        this._left = value;
    }

    get right(): Entry<K, V> | undefined {
        return this._right;
    }

    set right(value: Entry<K, V> | undefined) {
        this._right = value;
    }

    get parent(): Entry<K, V> | undefined {
        return this._parent;
    }
}

export class NumberComparator implements Comparator<number> {
    compare(a: number, b: number): number {
        return a - b;
    }
}

export class SubMapKeyIterator<K, T extends Equals> implements Iterator<T> {

    private _next?: Entry<K, T>;

    constructor(first?: Entry<K, T>, private fence?: Entry<K, T>) {
        this._next = first;
    }

    next(): IteratorResult<T> {

        let t = this._next;

        if (t === undefined || t.key == this.fence?.key)
            return {
                value: undefined,
                done: true
            };
        else {
            this._next = TreeMap.successor(t);
        }

        return {
            value: t?.value,
            done: false
        };
    }
}

class EntryIterator<K, T extends Equals> implements Iterator<Entry<K, T>> {

    private current?: Entry<K, T>;

    constructor(root?: Entry<K, T>) {
        this.current = root
    }

    next(): IteratorResult<Entry<K, T>> {

        let t = this.current;

        if (t === undefined) {
            return {
                value: undefined,
                done: true
            };
        } else {
            this.current = TreeMap.successor(t);
        }

        return {
            value: t,
            done: false
        };
    }

}

export class AscendingOrderTreeMapIterator<K, T extends Equals> implements Iterator<T> {

    private current?: Entry<K, T>;

    constructor(private last?: Entry<K, T>) {
        this.current = last;
    }

    next(): IteratorResult<T> {
        let t = this.current;

        if (t === undefined) {
            return {
                value: undefined,
                done: true
            };
        } else {
            this.current = TreeMap.successor(t);
        }

        return {
            value: t?.value,
            done: false
        };
    }
}

export class TreeMap<K, T extends Equals> implements Iterable<T> {

    private _root?: Entry<K, T>;
    private _size: number = 0;

    constructor(protected comparator: Comparator<K>) {
    }

    [Symbol.iterator](): Iterator<T> {
        return new AscendingOrderTreeMapIterator(this.getFirstEntry());
    }

    getCeilingEntry(key: K): Entry<K, T> | undefined {
        let p: Entry<K, T> | undefined = this._root;
        while (p != null) {
            let cmp = this.comparator.compare(key, p.key);
            if (cmp < 0) {
                if (p.left != null)
                    p = p.left;
                else
                    return p;
            } else if (cmp > 0) {
                if (p.right != null) {
                    p = p.right;
                } else {
                    let parent = p.parent;
                    let ch = p;
                    while (parent != null && ch == parent.right) {
                        ch = parent;
                        parent = parent.parent;
                    }
                    return parent;
                }
            } else
                return p;
        }
    }

    getHigherEntry(key: K): Entry<K, T> | undefined {
        let p: Entry<K, T> | undefined = this._root;
        while (p != null) {
            let cmp = this.comparator.compare(key, p.key);
            if (cmp < 0) {
                if (p.left != null)
                    p = p.left;
                else
                    return p;
            } else {
                if (p.right != null) {
                    p = p.right;
                } else {
                    let parent = p.parent;
                    let ch = p;
                    while (parent != null && ch == parent.right) {
                        ch = parent;
                        parent = parent.parent;
                    }
                    return parent;
                }
            }
        }
    }

    tooHigh(key: K, hi: K, hiInclusive: boolean, toEnd: boolean): boolean {
        if (!toEnd) {
            let c = this.comparator.compare(key, hi);
            if (c > 0 || (c == 0 && !hiInclusive))
                return true;
        }
        return false;
    }

    private absLowest(fromKey: K,
                      toKey: K,
                      loInclusive: boolean,
                      toInclusive: boolean,
                      fromStart: boolean = false): Entry<K, T> | undefined {
        let e =
            (fromStart ? this.getFirstEntry() :
                (loInclusive ? this.getCeilingEntry(fromKey) :
                    this.getHigherEntry(fromKey)));
        return (e == null || this.tooHigh(e.key, toKey, toInclusive, false)) ? undefined : e;
    }

    private absHighFence(toEnd: boolean, hiInclusive: boolean, hi: K): Entry<K, T> | undefined {
        return (toEnd ? undefined : (hiInclusive ?
            this.getHigherEntry(hi) :
            this.getCeilingEntry(hi)));
    }

    getFirstEntry(): Entry<K, T> | undefined {
        let p = this._root;
        if (p !== undefined)
            while (p.left !== undefined)
                p = p.left;

        return p;
    }

    subMap(fromKey: K, toKey: K, fromInclusive: boolean = true, toInclusive: boolean = true): { [Symbol.iterator]: () => SubMapKeyIterator<K, T> } {
        return {
            [Symbol.iterator]: () => new SubMapKeyIterator(
                this.absLowest(fromKey, toKey, fromInclusive, toInclusive), this.absHighFence(false, toInclusive, toKey)
            )
        };
    }

    entries() :  {[Symbol.iterator]: () => EntryIterator<K, T>} {
        return {
            [Symbol.iterator]: () => {
                return new EntryIterator(this.getFirstEntry());
            }
        }
    }

    set(k: K, value: T): T | undefined {

        let t = this._root;

        if (!t) {
            this.comparator.compare(k, k);

            this._root = new Entry<K, T>(k, value);
            this._size = 1;
            return;
        }

        let cmp: number;
        let parent: Entry<K, T>;

        do {
            parent = t;
            cmp = this.comparator.compare(k, t.key);
            if (cmp < 0)
                t = t.left;
            else if (cmp > 0)
                t = t.right;
            else {
                let old = t.value;
                t.value = value;
                return old;
            }
        } while (t !== undefined);

        let e = new Entry<K, T>(k, value, parent);
        if (cmp < 0)
            parent.left = e;
        else
            parent.right = e;
        this._size++;
    }

    get size(): number {
        return this._size;
    }

    static successor<K, T>(t: Entry<K, T>): Entry<K, T> | undefined {
        if (t == null)
            return undefined;
        else if (t.right != null) {
            let p = t.right;
            while (p.left != null)
                p = p.left;
            return p;
        } else {
            let p = t.parent;
            let ch = t;
            while (p != null && ch == p.right) {
                ch = p;
                p = p.parent;
            }
            return p;
        }
    }
}

export class TreeMultiValueMap<K, T extends Equals> extends TreeMap<K, List<T>> {

    put(k: K, value: T): List<T> | undefined {
        const list = new List([value]);
        const ret = super.set(k, list);

        if (ret) {
            for (const [_, v] of ret.entries()) {
                list.push(v);
            }
        }

        return ret;
    }


    clone() : TreeMultiValueMap<K, T> {

       const clone = new TreeMultiValueMap<K, T>(this.comparator);

       for (const entry of this.entries()) {
           for (const item of entry.value) {
               clone.put(entry.key, item)
           }
       }

       return clone;
    }

}


export class List<T extends Equals> extends Array<T> implements Equals {

    constructor(elements: T[] = []) {
        super();
        this.push(...elements);
    }

    contains(obj: T): boolean {
        for (let storageElement of this) {
            if (storageElement.equals(obj)) {
                return true;
            }
        }
        return false;
    }


    push(...items: T[]): number {
        return super.push(...items.filter(i => !this.contains(i)));
    }

    clone(): List<T> {
        const v: T[] = Array.from(this);
        return new List<T>(v)
    }

    equals(other: any): boolean {
        if (!other) {
            return false;
        }

        if (!(other instanceof List)) {
            return false;
        }

        for (const v of this) {
            if (!other.contains(v)) {
                return false;
            }
        }

        return true;
    }
}
