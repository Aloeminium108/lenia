# GPU-Accelerated Lenia

Lenia is a continuous generalization of Conway's Game of Life first proposed and implemented by Bert Wang-Chak Chan (For more info please click [here](https://chakazul.github.io/lenia.html)). 

## (Short) Formal Definition

Lenia is defined by:
- A scalar field, $A: \vec{x} \mapsto [0, 1]$, which is set in a Euclidean space, $L$
- A growth function, $G: [0, 1] \mapsto [-1, 1]$
- And a convolution kernel, $K: N \mapsto S$ where $N$ is the neighborhood defined by the radius of the kernel, $r$: $N = \\{ \vec{x} \in L: \||\vec{x}\||_{2} \leq r \\}$ and $S$ is the set of all possible states of $A(\vec{x})$ (In this implementation of Lenia, $S$ is simply treated as the interval $[0, 1]$)

The formula for calculating the state of $A(\vec{x})$ after a timestep $\Delta t$ is:
$A^{t+\Delta t}(\vec{x}) = {clip}(A^{t}(\vec{x}) + \Delta t G^t(\vec{x}) , 0, 1)$
Where $G^{t}$ is the result of the growth function $G$ being applied to the convolution of $K$ and $A^{t}$

### Or, in layman's terms

Lenia is a type cellular automata that can be defined in a space of any dimension. Along with that space, there is a convolution kernel and a growth function. Each point in that space has some value between 0 and 1, and to get the value for any given point in space at a particular timestep, you apply the following procedure to the previous timestep:
- Take the convolution of the space with the convolution kernel
- Apply the growth function to the convolution
- Add the result of the growth function back to the space, and clip the values between 0 and 1

## Optimization

The computationally expensive part of this process is the convolution. The naive approach to convolving a matrix by a kernel is essentially to overlay the kernel and the matrix so that the center of the kernel is at the corner of the matrix, take the sum of the products of each pair of values that are overlapping, and then move the kernel over and repeat for each value within the matrix. This results in a time complexity of $O(kn)$ where $k$ is the size of the kernel and $n$ is the size of the matrix. For small kernels this isn't a problem, but for Lenia it is desireable to have a kernel whose size is proportional to the matrix itself. This results in a time complexity closer to $O(n^2)$. A quadratic time complexity is highly undesireable, especially given that the input sizes are going to be proportional to the number of pixels on the screen and this algorithm is going to be running every frame.

This is where the convolution theorem comes in, which states that the Fourier transform of a convolution of two signals is the pointwise product of their Fourier transforms. This means that we can simply take the Fourier transform of the kernel and the Fourier transform of the matrix, multiply the pairs of elements with corresponding incices, and then take the inverse Fourier transform of the result. The multiplication itself only has a time complexity of $O(n)$, so the bottleneck becomes the speed of the Fourier transform. And luckily, Fourier transforms can be performed in linearithmic time, or $O(n \log n)$.

### Implementation of Fast Fourier Transform

