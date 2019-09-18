
export default class AjaxAssistant {

  constructor($) {
    this.$ = $
  }

  handleError(xhr, reject) {
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
      } else if(xhr.status === 403) {
        text = "That resource is forbidden to you"
      }
    }
    
    return reject(text)
  }
  
  get(path) {
    return new Promise((resolve, reject) => {
      this.$.ajax({
        url: path,
        dataType: 'JSON',
        success: (data) => resolve(data),
        error: (xhr) => this.handleError(xhr, reject)
      })
    })
  }

  delete(path) {
    return new Promise((resolve, reject) => {
      this.$.ajax({
        method: 'DELETE',
        url: path,
        beforeSend: (xhr) => { xhr.setRequestHeader('CSRF-Token', this.$('meta[name=csrf-token]').attr('content')) },
        success: (data) => resolve(data),
        error: (xhr) => this.handleError(xhr, reject)
      })
    })
  }
  
  post(path, data) {
    return new Promise((resolve, reject) => {
      if(!data) data = {}
      this.$.ajax({
        method: 'POST',
        url: path,
        dataType: 'JSON',
        data: data,
        beforeSend: (xhr) => { xhr.setRequestHeader('CSRF-Token', this.$('meta[name=csrf-token]').attr('content')) },
        success: (data) => resolve(data),
        error: (xhr) => this.handleError(xhr, reject)
      })
    })
  }
  
  put(path, data) {
    return new Promise((resolve, reject) => {
      if(!data) data = {}
      this.$.ajax({
        method: 'PUT',
        url: path,
        dataType: 'JSON',
        data: data,
        beforeSend: (xhr) => { xhr.setRequestHeader('CSRF-Token', this.$('meta[name=csrf-token]').attr('content')) },
        success: (data) => resolve(data),
        error: (xhr) => this.handleError(xhr, reject)
      })
    })
  }  
}
