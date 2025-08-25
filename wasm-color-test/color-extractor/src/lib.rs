use wasm_bindgen::prelude::*;
use image::{io::Reader, DynamicImage};
use quantette::{Quantizer, Color};

#[wasm_bindgen]
pub fn extract_color(image_data: &[u8]) -> String {
    // Attempt to load the image from the raw byte data
    let reader = match Reader::new(std::io::Cursor::new(image_data)).with_guessed_format() {
        Ok(reader) => reader,
        Err(_) => return "rgba(0,0,0,0)".into(), // Return transparent if format is unknown
    };

    let img = match reader.decode() {
        Ok(img) => img,
        Err(_) => return "rgba(0,0,0,0)".into(), // Return transparent if decoding fails
    };

    // Convert the image to a pixel buffer we can work with
    let pixels: Vec<Color> = img.to_rgba8().into_raw().chunks_exact(4).map(|c| Color::new(c[0], c[1], c[2], c[3])).collect();

    if pixels.is_empty() {
        return "rgba(0,0,0,0)".into();
    }

    // Use quantette to find the dominant color
    let quantizer = match Quantizer::new(&pixels, 256) {
        Ok(q) => q,
        Err(_) => return "rgba(0,0,0,0)".into(),
    };

    let palette = quantizer.palette();

    // The first color in the palette is the most dominant
    if let Some(dominant_color) = palette.get(0) {
        format!("rgba({},{},{},{})", dominant_color.r, dominant_color.g, dominant_color.b, dominant_color.a)
    } else {
        "rgba(0,0,0,0)".into() // Return transparent if no color is found
    }
}
