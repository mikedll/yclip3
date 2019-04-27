
export default class AjaxAssistant {

  constructor($) {
    this.$ = $
  }
  
  get(path, onSuccess, errorMessage) {
    return new Promise((resolve, reject) => {
      this.$.ajax({
        url: path,
        dataType: 'JSON',
        success: (data) => resolve(data),
        error: (xhr) => {
          var text = ""
          try {
            const data = JSON.parse(xhr.responseText)
            text = data.errors
          } catch(e) {
            text = xhr.responseText
          }

          if(text === "") {
            if(xhr.status === 404) {
              text = "A resource could not be found."
            }
          }
          
          reject(text)
        }
      })
    })
  }
}
