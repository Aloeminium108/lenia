# GPU-Accelerated Lenia

Lenia is a continuous generalization of Conway's Game of Life first proposed and implemented by Bert Wang-Chak Chan (For more info please click [here](https://chakazul.github.io/lenia.html)). It is a cellular automata which is defined by:
- A scalar field, $A: \vec{x} \mapsto [0, 1]$, which is set in a Euclidean space, $L$
- A growth function, $G: [0, 1] \mapsto [-1, 1]$
- And a kernel, $K: N \mapsto S$ where $N$ is the neighborhood defined by the radius of the kernel, $r$: $N = \{ \vec{x} \in L: \|\vec{x}\|_{2} \leq r\} and $S$ is the set of all possible states of $A(\vec{x})$

