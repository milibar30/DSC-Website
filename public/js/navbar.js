$("#search-icon").click(function () {
  $(".nav").toggleClass("search");
  $(".nav").toggleClass("no-search");
  $(".search-input").toggleClass("search-active");
});

$(".menu-toggle").click(function () {
  $(".nav").toggleClass("mobile-nav");
  $(this).toggleClass("is-active");
});

let filterInput2 = document.getElementById("search1");
let srh2 = document.getElementById("srh1");
var flag = 1;
srh2.addEventListener("click", () => {
  let ul = document.getElementById("search_list1");
  if (ul.style.display !== "none" || flag == 0) {
    ul.style.display = "none";
    flag = 1;
  }
});
//add event listener
filterInput2.addEventListener("keyup", filternames2);

function filternames2() {
  //get value of input
  let filterValue = document.getElementById("search1").value.toUpperCase();
  //Get names ul
  let ul = document.getElementById("search_list1");
  //get lis from ul
  let li = ul.querySelectorAll("li.collection-item2");
  ul.style.display = "block";
  //loop through collection item lis

  for (let i = 0; i < li.length; i++) {
    let a = li[i].getElementsByTagName("a")[0];
    console.log(a, filterValue);
    //if matched

    if (
      a.innerHTML.toUpperCase().indexOf(filterValue) > -1 &&
      filterValue != ""
    ) {
      li[i].style.display = "block";
    } else {
      li[i].style.display = "none";
    }
  }
}

let filterInput1 = document.getElementById("search2");
let srh4 = document.getElementById("srh2");
var flag = 1;
srh4.addEventListener("click", () => {
  let ul = document.getElementById("search_list2");
  if (ul.style.display !== "none" || flag == 0) {
    ul.style.display = "none";
    flag = 1;
  }
});
//add event listener
filterInput1.addEventListener("keyup", filternames1);

function filternames1() {
  //get value of input
  let filterValue = document.getElementById("search2").value.toUpperCase();
  //Get names ul
  let ul = document.getElementById("search_list2");
  //get lis from ul
  let li = ul.querySelectorAll("li.collection-item2");
  ul.style.display = "block";
  //loop through collection item lis

  for (let i = 0; i < li.length; i++) {
    let a = li[i].getElementsByTagName("a")[0];
    console.log(a, filterValue);
    //if matched

    if (
      a.innerHTML.toUpperCase().indexOf(filterValue) > -1 &&
      filterValue != ""
    ) {
      li[i].style.display = "block";
    } else {
      li[i].style.display = "none";
    }
  }
}

var dropBtn = document.getElementById("dropbtn");
var dropdown = document.getElementsByClassName("dropdown")[0];
dropBtn.onclick = function () {
  dropdown.classList.toggle("hover-active");
};
