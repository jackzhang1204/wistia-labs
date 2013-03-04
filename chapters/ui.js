function updateOutput() {
  var sourceEmbedCode = Wistia.EmbedCode.parse($("#source_embed_code").val());
  var outputEmbedCode = Wistia.EmbedCode.parse($("#source_embed_code").val());

  if (sourceEmbedCode && sourceEmbedCode.isValid()) {
    // Set custom options on the embed code.

    // Add as many chapters as have been filled in
    for (var i = 1; i <= 8; i++) {
      if ($("#chapter_" + i.toString() + "_title").val() != "Chapter " + i.toString()) {
        outputEmbedCode.setOption("ch_" + i.toString() + "_title", $("#chapter_" + i.toString() + "_title").val());
        outputEmbedCode.setOption("ch_" + i.toString() + "_time", $("#chapter_" + i.toString() + "_time").val());
      }
    }

    // Display the output.
    $("#output_embed_code").val(outputEmbedCode.toString());
    outputEmbedCode.previewInElem("preview");

  } else {

    // Show an error if invalid. We can be more specific 
    // if we expect a certain problem.
    $("#output_embed_code").val("Please enter a valid Wistia embed code.");
    $("#preview").html('<div id="placeholder_preview">Your video here</div>');
  }
}


// Updating is kind of a heavy operation; we don't want to 
// do it on every single keystroke.
var updateOutputTimeout;
function debounceUpdateOutput() {
  clearTimeout(updateOutputTimeout);
  updateOutputTimeout = setTimeout(updateOutput, 500);
}


// Assign all DOM bindings on doc-ready in here. We can also 
// run whatever initialization code we might need.
window.setupLabInterface = function($) {
  $(function() {
    // Update the output whenever a configuration input changes.
    $("#configure")
      .on("keyup", "input[type=text], textarea", debounceUpdateOutput)
      .on("change", "select", debounceUpdateOutput)
      .on("click", ":radio,:checkbox", debounceUpdateOutput);
  });
};