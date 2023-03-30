# GPU-Accelerated Lenia

Lenia is a continuous generalization of Conway's Game of Life first proposed and implemented by Bert Wang-Chak Chan (For more info please click [here](https://chakazul.github.io/lenia.html)). 

## (Short) Formal Definition

Lenia is defined by:
- A scalar field, $A: L \mapsto [0, 1]$, where $L$ is a Euclidean space (This implementation uses a 2-dimensional Euclidean space, but Lenia can be implemented in any dimension)
- A growth function, $G: [0, 1] \mapsto [-1, 1]$
- And a convolution kernel, $K: N \mapsto S$ where $N$ is the neighborhood defined by the radius of the kernel, $r$: $N = \\{ \vec{x} \in L: \||\vec{x}\||_{2} \leq r \\}$ and $S$ is the set of all possible states of $A(\vec{x})$ (In this implementation of Lenia, $S$ is simply treated as the interval $[0, 1]$)

The formula for calculating the state of $A(\vec{x})$ after a timestep $\Delta t$ is:
$A^{t+\Delta t}(\vec{x}) = {clip}(A^{t}(\vec{x}) + \Delta t G^t(\vec{x}) , 0, 1)$
Where $G^{t}$ is the result of the growth function $G$ being applied to the convolution of $K$ and $A^{t}$

### Or, in layman's terms

Lenia is a type of cellular automata that can be defined in a space of any dimension. Along with that space, there is a convolution kernel and a growth function. Each point in that space has some value between 0 and 1, and to get the value for any given point in space at a particular timestep, you apply the following procedure to the previous timestep:
- Take the convolution of the space with the convolution kernel
- Apply the growth function to the convolution
- Add the result of the growth function back to the space, and clip the values between 0 and 1

## Controls

On the left side of the screen there are two panels, one for generating the convolution kernel and one for controlling the growth function.
On the right side of the screen there are sliders labeled 'delta-T' and 'Brush Size, and there are two buttons labeled 'reset' and 'clear'.
In addition to these panels of controls, the canvas can be interacted with directly.

### Drawing

Clicking and dragging the mouse over the canvas 'draws' on the scalar field. Drawing with the left mouse button sets all the values drawn over to 1, and drawing with the right mouse button sets all the values drawn over to 0. Essentially, the left button draws, and the right button erases.

### Kernel Controls

The panel for kernel controls consists of an image of the current kernel, a set of sliders, and three buttons.

Each slider controls the peak value of a ring in the kernel. Up to 8 rings can be added using the button labeled '+', and the outer ring can be removed using the button labeled '-' as long as there is are at least 2 rings.

There is an additional slider, labeled 'Core Width', which controls the width of each of these rings.

Adjusting these sliders does not affect the kernel itself until the 'Generate Kernel' button is clicked. This is because kernel generation is a somewhat expensive process, and doing so with every update of a slider would hinder performance.

### Growth Function Controls

The panel for growth function controls consists of an image of the graph of the growth function and two sliders. The domain of the graph is on the interval of $[0, 1]$, and its range is on the interval of $[-1, 1]$. The graph is stretched horizontally for better readability.

The first slider, labeled 'Center', controls where the center of the bell curve is in the graph. 

The second slider, labeled 'Width', controls how wide the bell is.

The growth function is updated in real time as these sliders are moved.

### Delta Controls

The slider, labeled 'delta-T', controls the value of $\Delta t$. This slider ranges in value from 0 to 1. When set to 0, the simulation slows to a complete stop. When set to 1, the simulation runs at its maximum timestep size, which is generally too fast to be practically useful. Different combinations of kernel parameters and growth functions may result in faster or slower evolutions within the scalar field. It should also be noted that different time resolutions may affect the behavior of the simulation in unexpected ways. 

The value of $\Delta t$ is updated in real time as this slider is moved.

### Brush Size

The slider, labeled 'Brush Size', controls the radius around the mouse that is affected when drawing.

### Reset

The button, labeled 'Reset', sets all points in the scalar field to a random value between 0 and 1.

### Clear

The button, labeled 'Clear', sets all points in the scalar field to 0.

## Optimization

The computationally expensive part of this process is the convolution. The naive approach to convolving a matrix by a kernel is essentially to overlay the kernel and the matrix so that the center of the kernel is at the corner of the matrix, take the sum of the products of each pair of values that are overlapping, and then move the kernel over and repeat for each value within the matrix. This results in a time complexity of $O(kn)$ where $k$ is the size of the kernel and $n$ is the size of the matrix. For small kernels this isn't a problem, but for Lenia it is desireable to have a kernel whose size is proportional to the matrix itself. This results in a time complexity closer to $O(n^2)$. A quadratic time complexity is highly undesireable, especially given that the input sizes are going to be proportional to the number of pixels on the screen and this algorithm is going to be running every frame.

This is where the convolution theorem comes in, which states that the Fourier transform of a convolution of two signals is the pointwise product of their Fourier transforms. This means that we can simply take the Fourier transform of the kernel and the Fourier transform of the matrix, multiply the pairs of elements with corresponding incices, and then take the inverse Fourier transform of the result. The multiplication itself only has a time complexity of $O(n)$, so the bottleneck becomes the speed of the Fourier transform. And luckily, Fourier transforms can be performed in linearithmic time, or $O(n \log n)$.

As with most optimization problems, there were many local minima that I encountered before settling on the implementation that I have now. I want to present the path that I took because every step along the way informed future iterations of the algorithm. As such, explaining the current algorithm is easiest with the context of its predecessors.

### Discrete Fourier Transform

Since TypeScript does not have library for them, I first wrote a simple interface for complex numbers, equipped with methods for addition, multiplication, and exponentiation. I then used this to implement a basic Discrete Fourier Transform (DFT) algorithm. The formula for DFT is:
$$X_{k} = \sum_{n=0}^{N-1} x_{n} * e^{ \frac{-i2 \pi k n}{N} }$$
Where {x} is the signal in the time domain, {X} is that same signal in the frequency domain, and {N} is the number of samples within the signal. Stuart Riffle presents a great explanation for the intuition behind this formula:

![To find the energy at a particular frequency, spin your signal around a circle at that frequency, and average a bunch of points along that path](https://web.archive.org/web/20120418231513im_/http://altdevblogaday.com/wp-content/uploads/2011/05/DerivedDFT.png)

Now, what you may notice here is that the formula involves $n$ additions and $n^2$ multiplications, where $n$ is the length of the signal. This gives a time complexity of $O(n^2)$, meaning that using this is no faster than just naive convolution. I only actually implemented the DFT to have a functioning Fourier transform algorithm to compare the results of faster algorithms to. You may also notice that the signal here is 1-dimensional, while the scalar field that we need to convolve may be in a Euclidean space of any dimension; in particular, my implementation of Lenia takes place in a 2-dimensional space. This will be resolved in later iterations, but at this point the only algorithm necessary is a functional Fourier transform.

### Fast Fourier Transform

There are multiple Fast Fourier Transform (FFT) algorithms, but the most common is the Radix-2 Cooley-Tukey FFT. The intuition for how any FFT works is essentially this: since we are working with frequencies, we can take advantage of their periodicity and pull out redundant calculations. Radix-2 Cooley-Tukey specifically takes advantage of a specific property of the DFT, which is summed up by the following two formulae:
$$X_{k} = E_{k} + e^{ \frac{-i2 \pi k}{N}} O_{k}$$
$$X_{k + \frac{N}{2}} = E_{k} - e^{ \frac{-i2 \pi k}{N}} O_{k}$$
Where $E$ and $O$ are the Fourier transforms of the even and odd indexed samples of the signal, respectively. What this means is that we can unzip the our signal into its even and odd samples, and perform Fourier transforms on those instead. Since the DFT runs in quadratic time, dividing the input in two actually gives about a fourfold increase in speed. That is not enough, but the afformentioned property that allowed us to do this in the first place still applies to the two smaller signals we have created. So, we can reapply the process, splitting both of those signals into their even and odd samples. This bifurcation can continue until each signal is only the size of an individual sample. 

This means we can define a very simple recursive algorithm for Radix-2 Cooley-Tukey FFT:
```
function FFT(x) {
    
    let N = length of x
    
    if N <= 1 return
    
    let E = Even elements of x
    let O = Odd elements of x
    
    FFT(E)
    FFT(O)
    
    for (let k = 0; k < N/2; k++) {
    
        x[k] = E[k] + twiddleFactor(k, N) * O[k]
        
        x[k + N/2] = E[k] - twiddleFactor(k, N) * O[k]
    
    }
    
    return x

}
```
Where twiddleFactor(k, N) is simply a function that calculates $e^{ \frac{-i2 \pi k}{N} }$.

One thing of note here is that the size of the signal has to be a power of 2. There are workarounds to this, but for now the focus is on efficient convolution. The resolution of our image is simply set to something like 256 x 256 or 512 x 512 so that this restriction is satisfied without having to worry about it any further.

#### 2-Dimensional Fourier Transform

The final step before we can actually use this is to jump into the next dimension. Luckily, this is actually incredibly simple. All we need to do is take the Fourier transform of each column, giving a partially transformed matrix, and then take the Fourier transform of each row of that matrix. When performing the inverse FFT, we just do the same thing in reverse; take the inverse FFT of each row and *then* the inverse FFT of each column.

### Rust and WebAssembly (WASM)

When I actually ran this program, much to my excitement, it worked. I could use any size of kernel and the framerate stayed consistent. However, the framerate that I was getting was disappointing. It hovered around 20fps, which is unacceptable. When I tried to use a naive convolution algorithm instead, it became even slower. Of course, the speed of naive convolution is dependent on the size of the kernel, so I was able to achieve 60fps with a tiny kernel.

One issue here is that the TypeScript code is being transpiled into JavaScript, which is then being compiled into bytecode by the browser using just-in-time (JIT) compilation. In the end, the code being executed is simply not as performant as code written in languages like C++ or Rust. Those languages allow for much lower-level control of memory, which means developers can use them to write more efficient code. 

One clear example of why this makes a difference here is the difference in how compilers handle functions. Any time a function is called in our code, that comes with some computational overhead as the CPU has to put all of the parameters of the function onto the stack along with an instruction pointer that gives the location in the code where it entered the function from. Then when the function is finished executing, the CPU has to return whatever value was produced (if any) and move the instruction pointer back to the appropriate location in memory. Each of our methods for arithmetic with complex numbers involves this process, which comes with signficiant overhead. Compilers for languages like C++ and Rust are quite clever and can actually "inline" these functions, which essentially means rewriting the entire body of the function wherever it is called instead of actually giving the function its own subroutine. Where applicable, this saves on a non-trivial amount of computational overhead.

Another example of why JavaScript can slow us down here is how the language handles object property access. Objects in JavaScript are actually implemented as hash tables. Basically, when accessing the property of an object in JavaScript, a hash function is applied to the name of that property, which gives its location in memory. There are good reasons for this, and generally this is efficient enough, but it does mean that there is some amount of overhead to accessing the property of an object in JavaScript. 

The overhead from these things is negligible for most frontend applications, but we are performing hundreds of thousands of function calls every second, so they add up here. Some of these things can be fixed within TypeScript; for example we can manually inline our functions and rewrite our complex arithmetic library to work with arrays instead of objects. This, however, leads to code that is much less readable and maintainable. Not to mention there is no gaurantee that that would give as much of a performance increase as desired. So instead, I decided to switch from TypeScript to Rust.

With Rust, I am able to use existing packages with FFT implementations that are much faster than anything I could write myself. I can then compile that Rust code into WebAssembly, which is a very low-level programming language analogous to normal assembly code that can be executed in the browser. This gives a sizeable performance boost, bringing my implementation of Lenia up to 60fps.

### GPU Acceleration

There is not any Rust or WASM code in this repository, and that is because that solution was not satisfactory for me. The first issue is that the WASM API is incredibly tedious to work with, so the codebase became unmaintainable. The process for making the scalar field reset when the canvas is clicked in TypeScript would looke something like:
```
const reset = () => {
    // Set each value of the matrix to 0
}

const canvas = document.querySelector('canvas')
canvas.addEventListener('click', reset)
```
While in Rust, targeting WASM, I would need to clone a `Arc<Mutex<Vec<Vec<Complex<f32>>>>>` so it can be consumed by a `Closure<dyn FnMut()>` that can then be passed `.as_ref().uncheckedref()` to `document.unwrap().get_element_by_id("canvas").unwrap().unwrap().add_event_listener_with_callback().Ok()`. Even if you are not familiar with TypeScript, I think it is very easy to see why it would be easier to approach here.

The next issue is that this was not as fast as I wanted. 60fps is the goal, so it would seem that we already achieved the desired performance. But That is 60fps on my own machine, with only single-channel Lenia, restricted to a 256 x 256 field. Expanding to more channels and higher resolutions would no doubt result in lower framerates, especially on weaker machines.

To me, the obvious next step was parallelization. Up to this point, all of the code executed has been on a single thread, utilizing just a single CPU core. Even cheap laptops usually have 2-4 cores these days, so we have untapped computational power to utilize. That said, parallelizing on the CPU did not seem at all appealing to me. That kind of parallelization is achieved in JavaScript (and by extension, WASM) using webworkers, which can be tedious to work with for their own reasons. Not only that, but using a few more CPU cores did not seem like it would give the kind of performance increase I actually wanted. I wanted to be able to use thousands of cores. Which is where the GPU comes in.

I was inspired by implementations I saw of Lenia that were written as shaders. I switched back to TypeScript and added GPU.js to the project, which compiles JavaScript code into a form the GPU can read and execute. This comes with a ton of restrictions on how that code is written, but there is still more than enough latitude to implement what we need. The simplest path here was to actually reimplement naive convolution, but in a GPU-parallelized form. This gave a massive performance increase and allowed me to return to writing frontend code in a simple, idiomatic way using TypeScript. 

### GPU-Accelerated FFT

There is something ironic about the fact that, up to this point, the fastest implementation by far actually used the algorithm that was outlined at the beginning of this journey as being the slowest. There are consequences to this, though. This is a web application, so I am invested in how it performs on a variety of devices. Not every device has a dedicated GPU, which GPU.js handles by letting those devices use the CPU as a fallback to execute the same code. There is a peculiar consequence to this; Lenia using GPU-accelerated naive convolution runs blazingly fast on any desktop with a good GPU, but hardly runs at all on mobile phones. Meanwhile, Lenia implemented in WASM chugs along at a mediocre pace on desktops, but runs *well enough* on mobile phones. This is because the actual algorithm being used in the WASM implementation was much better in terms of computational complexity.

Another consequence is that, while much faster, GPU-accelerated naive convolution quickly hits a wall when the size of the kernel is increased. Doing some rudimentary time-complexity analysis, one can easily see that FFT convolution will tend to outperform naive convolution once the kernel size is any larger than an 8 x 8 matrix. This is absolutely tiny, and this means that the resolution of the kernel is too low to allow for the kinds of complex structures that are desired to arise. 

To solve both of these issues, I sought to switch to a GPU-accelerated form of the FFT. This presents a major challenge, however. When writing code for the GPU, we have to fundamentally change our approach. The code that we are handing over to the GPU is actually being executed on many individual cores at once. Each core knows its "position" in the group, but it has little capacity to communicate with the other cores. The FFT algorithm that I outlined is recursive, which does not translate well to this architecture. There is no way to delegate the recursed function calls to individual cores, especially because each level of recursion incorporates the results from other levels to execute.

What we need is an iterative version of FFT. Iterative FFT implementations are actually significantly faster than recursive implementations in almost any context, as recursion comes with computational overhead that can be avoided with an iterative approach. The reason why we started with a recursive approach, and the reason why most explenations of the FFT begin with the recursive approach, is that it is easier to understand and implement. 

The important step in iterative FFT that is not necessary with recursive FFT is the rearrangement of samples in the signal before iterating. This is actually done implicitly with the recursive approach, but for an iterative approach we must do this explicitly. When repeatedly decomposing the signal into even and odd samples, we can visualize the paths that each sample takes.

![FFT decomposition](https://www.algorithm-archive.org/contents/cooley_tukey/res/radix-8screen.jpg)

This distinctive fractal pattern forms as the signal is bifurcated further and further. If we can rearrange the samples in our signal to mimic this pattern, then we can then iterate over our rearranged signal and get the result we want, no recursion required. The way we mimic this pattern is by bit-reversing the indices of the samples in our signal. This means that we take a binary representation of each sample's index and write it backwards to get its new index. Because we have already restricted our signal size to powers of 2, we know that the bit-reversed index of any given sample will point somewhere within the signal. Most of the time, this point to a different location, but any time the binary representation is symmetrical (i.e. 0000, 01010, or 111111111) then it will point back to the original location. 

Once our signal is rearranged, we iterate over the signal by performing the same calculations as those used in the recursive implementation. Essentially, each iteration places the results of the DFTs of the even and odd signals at increasingly distant points in the array until the entire transform is calculated. Once again, the iterative approach is not as easy to immediately grasp and the visualization for FFT decomposition linked above is very useful for understanding what is going on here. The following pseudocode is also helpful for illustrating the process being described, even if it does not elucidate the intuition for why the process works:
```
iterativeFFT(x) {

    x = bitReverseIndices(x)
    
    let N = length of x
    
    for (let n = 2; n <= N; n *= 2) {
        
        let pass = []
        
        for (let i = 0; i < N; i++) {
        
            if (i % n < n/2) {
                pass[i] = x[i] + twiddleFactor(i % n, n) * x[i + n/2]
                pass[i + n/2] = x[i] - twiddleFactor(i % n, n) * x[i + n/2]
            }
        
        }
        
        x = pass
    
    }
    
    return x
    
}
```

Using this approach, we have an insanely fast convolution. Regardless of kernel size, our convolution runs at a consistent speed, and it even runs really well when the CPU is used as a fallback. Since I began integrating React into the project around this point, the framerate cap was increased to 120fps, which this implementation runs at with no problem on my machine. 
